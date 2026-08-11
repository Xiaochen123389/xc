/**
 * TMS 三部门数据同步模块
 * 用途：客服 / 单证 / 海外仓 在各自板块填写的费用记录
 *       自动同步到 应收 / 应付 页面的部门数据区域。
 * 机制：localStorage 共享 + storage 事件跨标签页通知
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'tms_dept_sync_data_v1';

  var DEPT_KEYS = {
    '客服': 'cs',
    '单证': 'document',
    '海外仓': 'warehouse'
  };

  var DEPT_NAMES = {
    cs: '客服',
    document: '单证',
    warehouse: '海外仓'
  };

  var FEE_TYPES = {
    cs: [
      { value: 'freightDiff', label: '运费补差' },
      { value: 'serviceFee', label: '服务费' },
      { value: 'urgentFee', label: '加急费' },
      { value: 'claimFee', label: '理赔费' },
      { value: 'other', label: '其他' }
    ],
    document: [
      { value: 'customs', label: '报关费' },
      { value: 'inspection', label: '商检费' },
      { value: 'certificate', label: '产地证' },
      { value: 'document', label: '文件费' },
      { value: 'other', label: '其他' }
    ],
    warehouse: [
      { value: 'storage', label: '仓储费' },
      { value: 'operation', label: '操作费' },
      { value: 'pallet', label: '托盘费' },
      { value: 'loading', label: '装卸费' },
      { value: 'other', label: '其他' }
    ]
  };

  function nowString() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function generateId(prefix) {
    return (prefix || 'rec') + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  function safeParse(json) {
    try { return JSON.parse(json); } catch (e) { return null; }
  }

  function getRawData() {
    var raw = localStorage.getItem(STORAGE_KEY);
    var data = safeParse(raw) || {};
    if (!Array.isArray(data.cs)) data.cs = [];
    if (!Array.isArray(data.document)) data.document = [];
    if (!Array.isArray(data.warehouse)) data.warehouse = [];
    return data;
  }

  function saveRawData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ===== 对外 API =====

  var DeptSync = {
    STORAGE_KEY: STORAGE_KEY,
    DEPT_KEYS: DEPT_KEYS,
    DEPT_NAMES: DEPT_NAMES,
    FEE_TYPES: FEE_TYPES,

    nowString: nowString,
    generateId: generateId,

    /**
     * 读取某个部门的全部记录
     */
    getRecords: function (deptKey) {
      var data = getRawData();
      return data[deptKey] || [];
    },

    /**
     * 按 ID 读取单条记录
     */
    getRecordById: function (deptKey, id) {
      var records = this.getRecords(deptKey);
      for (var i = 0; i < records.length; i++) {
        if (records[i].id === id) return records[i];
      }
      return null;
    },

    /**
     * 新增记录
     */
    addRecord: function (deptKey, record) {
      var data = getRawData();
      var rec = Object.assign({}, record);
      rec.id = rec.id || generateId(deptKey);
      rec.source = deptKey;
      rec.sourceName = DEPT_NAMES[deptKey] || rec.sourceName || '';
      rec.createTime = rec.createTime || nowString();
      if (!rec.status) rec.status = 'pending';
      data[deptKey].unshift(rec);
      saveRawData(data);
      this._notify({ type: 'add', deptKey: deptKey, record: rec });
      return rec;
    },

    /**
     * 更新记录
     */
    updateRecord: function (deptKey, id, updates) {
      var data = getRawData();
      var records = data[deptKey] || [];
      for (var i = 0; i < records.length; i++) {
        if (records[i].id === id) {
          Object.assign(records[i], updates);
          saveRawData(data);
          this._notify({ type: 'update', deptKey: deptKey, record: records[i] });
          return records[i];
        }
      }
      return null;
    },

    /**
     * 删除记录
     */
    deleteRecord: function (deptKey, id) {
      var data = getRawData();
      var records = data[deptKey] || [];
      var found = false;
      for (var i = records.length - 1; i >= 0; i--) {
        if (records[i].id === id) {
          records.splice(i, 1);
          found = true;
        }
      }
      if (found) {
        saveRawData(data);
        this._notify({ type: 'delete', deptKey: deptKey, id: id });
      }
      return found;
    },

    /**
     * 改变状态（confirmed / reported / pending）
     */
    setStatus: function (deptKey, id, status) {
      return this.updateRecord(deptKey, id, { status: status });
    },

    /**
     * 将某个部门记录批量上报/确认，并触发同步
     */
    confirmAndSync: function (deptKey, ids) {
      var self = this;
      var synced = [];
      ids.forEach(function (id) {
        var rec = self.setStatus(deptKey, id, 'reported');
        if (rec) synced.push(rec);
      });
      this._notify({ type: 'sync', deptKey: deptKey, records: synced });
      return synced;
    },

    /**
     * 重置为默认示例数据（可选）
     */
    resetDemoData: function () {
      saveRawData({ cs: [], document: [], warehouse: [] });
      this._notify({ type: 'reset' });
    },

    /**
     * 获取费用类型中文名
     */
    getFeeTypeName: function (deptKey, feeTypeValue) {
      var list = FEE_TYPES[deptKey] || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].value === feeTypeValue) return list[i].label;
      }
      return feeTypeValue;
    },

    /**
     * 将记录转换为应收/应付详情页中 deptData 的条目格式
     * 保留 sourceRecordId / waybill / feeType 等业务键，便于后续重复检测
     */
    toFinanceDeptItem: function (record) {
      return {
        name: record.feeTypeName || record.feeType || '其他',
        amount: Number(record.amount) || 0,
        remark: record.remark || '',
        time: record.createTime || nowString(),
        operator: record.operator || record.sourceName || '',
        sourceRecordId: record.id || '',
        waybill: record.waybill || '',
        customer: record.customer || '',
        feeType: record.feeType || '',
        source: record.source || '',
        auditStatus: record.auditStatus || 'normal' // normal / pending / diff
      };
    },

    /**
     * 生成应收/应付详情页所需的 deptData 数组
     * 返回：[{dept:'客服', items:[...]}, {dept:'单证', items:[...]}, {dept:'海外仓', items:[...]}]
     * 默认包含全部记录；可通过 filterStatus 筛选状态，例如只同步 'reported'
     */
    getFinanceDeptData: function (filterStatus) {
      var self = this;
      var result = [];
      ['cs', 'document', 'warehouse'].forEach(function (key) {
        var records = self.getRecords(key);
        if (filterStatus) {
          records = records.filter(function (r) { return filterStatus.indexOf(r.status) !== -1; });
        }
        result.push({
          dept: DEPT_NAMES[key],
          items: records.map(function (r) { return self.toFinanceDeptItem(r); })
        });
      });
      return result;
    },

    /**
     * 合并同步数据到现有 deptData，实现：
     * - 业务键相同（waybill + feeType + dept）且金额相同 → 覆盖旧记录（刷新时间与操作人）
     * - 业务键相同但金额不同 → 新记录标记为 auditStatus:'pending'，保留旧记录供财务审核
     * - 业务键不同 → 追加
     */
    mergeIntoDeptData: function (existingDeptData, syncedDeptData) {
      var result = JSON.parse(JSON.stringify(existingDeptData || []));

      function getBizKey(item) {
        return (item.waybill || '') + '|' + (item.feeType || item.name || '') + '|' + (item.customer || '');
      }

      syncedDeptData.forEach(function (syncDept) {
        var existing = result.find(function (d) { return d.dept === syncDept.dept; });
        if (!existing) {
          result.push({ dept: syncDept.dept, items: syncDept.items.slice() });
          return;
        }

        syncDept.items.forEach(function (syncItem) {
          var syncKey = getBizKey(syncItem);
          // 空业务键时按 sourceRecordId 匹配；仍无则追加
          var matchIndex = -1;
          if (syncKey !== '|') {
            existing.items.forEach(function (it, idx) {
              if (getBizKey(it) === syncKey) matchIndex = idx;
            });
          }
          if (syncItem.sourceRecordId && matchIndex === -1) {
            existing.items.forEach(function (it, idx) {
              if (it.sourceRecordId === syncItem.sourceRecordId) matchIndex = idx;
            });
          }

          if (matchIndex === -1) {
            // 全新记录，直接追加
            existing.items.push(syncItem);
          } else {
            var oldItem = existing.items[matchIndex];
            if (Number(oldItem.amount) === Number(syncItem.amount)) {
              // 完全重复：覆盖（保留原记录但更新时间与操作人，表示已确认最新）
              existing.items[matchIndex] = Object.assign({}, syncItem, { auditStatus: 'normal' });
            } else {
              // 同一业务但金额不同：标记差异，保留新记录为待审核，旧记录继续保留
              var pendingItem = Object.assign({}, syncItem, { auditStatus: 'pending' });
              // 如果已经存在相同 sourceRecordId 的 pending 记录则替换，否则追加
              var pendingIdx = -1;
              existing.items.forEach(function (it, idx) {
                if (it.sourceRecordId === syncItem.sourceRecordId && it.auditStatus === 'pending') {
                  pendingIdx = idx;
                }
              });
              if (pendingIdx !== -1) {
                existing.items[pendingIdx] = pendingItem;
              } else {
                existing.items.push(pendingItem);
              }
            }
          }
        });
      });

      return result;
    },

    /**
     * 应收/应付详情页专用：直接返回合并后的 deptData
     */
    getMergedDeptData: function (existingDeptData, filterStatus) {
      var synced = this.getFinanceDeptData(filterStatus);
      return this.mergeIntoDeptData(existingDeptData, synced);
    },

    /**
     * 金额格式化（与页面中 money-cell 风格一致）
     */
    fmtMoney: function (num) {
      var n = Number(num) || 0;
      return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    },

    /**
     * 状态标签映射
     */
    STATUS_LABELS: {
      pending: '待确认',
      confirmed: '已确认',
      reported: '已上报'
    },

    STATUS_CLASSES: {
      pending: 'tag-gray tag-dot',
      confirmed: 'tag-green tag-dot',
      reported: 'tag-orange tag-dot'
    },

    /**
     * 监听同步事件（storage 事件 + 自定义事件）
     */
    onSync: function (callback) {
      if (typeof callback !== 'function') return;
      var handler = function (e) {
        if (e && e.detail) callback(e.detail);
      };
      document.addEventListener('tms-dept-sync', handler);
      window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) {
          callback({ type: 'storage', raw: e.newValue });
        }
      });
    },

    _notify: function (detail) {
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('tms-dept-sync', { detail: detail }));
      }
    }
  };

  // 兼容 CommonJS / 浏览器
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeptSync;
  } else {
    global.DeptSync = DeptSync;
  }
})(typeof window !== 'undefined' ? window : this);
