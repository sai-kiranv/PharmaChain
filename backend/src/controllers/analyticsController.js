const db = require('../config/db');

async function getDashboardMetrics(req, res) {
  try {
    // 1. Table Counts
    const countsSql = `
      SELECT 'CONSUMER' AS tbl, COUNT(*) AS cnt FROM CONSUMER
      UNION ALL SELECT 'ORGANIZATION', COUNT(*) FROM ORGANIZATION
      UNION ALL SELECT 'DRUGS', COUNT(*) FROM DRUGS
      UNION ALL SELECT 'BATCH', COUNT(*) FROM BATCH
      UNION ALL SELECT 'STORAGE_LOCATION', COUNT(*) FROM STORAGE_LOCATION
      UNION ALL SELECT 'BATCH_STORAGE', COUNT(*) FROM BATCH_STORAGE
      UNION ALL SELECT 'CUSTODY_TRANSFER', COUNT(*) FROM CUSTODY_TRANSFER
      UNION ALL SELECT 'COMPLIANCE_CHECK', COUNT(*) FROM COMPLIANCE_CHECK
      UNION ALL SELECT 'VERIFICATION_LOG', COUNT(*) FROM VERIFICATION_LOG
    `;
    const countsResult = await db.executeQuery(countsSql);
    const tableCounts = {};
    countsResult.rows.forEach(r => {
      tableCounts[r.TBL] = r.CNT;
    });

    // 2. Batch Status Breakdown (Active, Expiring in 90 days, Expired)
    const batchMetricsSql = `
      SELECT
        COUNT(*) AS TOTAL_BATCHES,
        SUM(QUANTITY) AS TOTAL_UNITS,
        SUM(CASE WHEN EXP_DATE > SYSDATE THEN 1 ELSE 0 END) AS ACTIVE_BATCHES,
        SUM(CASE WHEN EXP_DATE <= SYSDATE THEN 1 ELSE 0 END) AS EXPIRED_BATCHES,
        SUM(CASE WHEN EXP_DATE > SYSDATE AND EXP_DATE <= SYSDATE + 90 THEN 1 ELSE 0 END) AS EXPIRING_SOON_BATCHES
      FROM BATCH
    `;
    const batchResult = await db.executeQuery(batchMetricsSql);

    // 3. Compliance Check Results
    const complianceSql = `
      SELECT
        COUNT(*) AS TOTAL_CHECKS,
        SUM(CASE WHEN UPPER(RESULT) = 'PASS' THEN 1 ELSE 0 END) AS PASS_COUNT,
        SUM(CASE WHEN UPPER(RESULT) = 'FAIL' THEN 1 ELSE 0 END) AS FAIL_COUNT
      FROM COMPLIANCE_CHECK
    `;
    const complianceResult = await db.executeQuery(complianceSql);

    // 4. Verification Logs breakdown
    const verifSql = `
      SELECT
        COUNT(*) AS TOTAL_LOGS,
        SUM(CASE WHEN UPPER(RESULT) = 'GENUINE' THEN 1 ELSE 0 END) AS GENUINE_COUNT,
        SUM(CASE WHEN UPPER(RESULT) != 'GENUINE' THEN 1 ELSE 0 END) AS SUSPICIOUS_COUNT
      FROM VERIFICATION_LOG
    `;
    const verifResult = await db.executeQuery(verifSql);

    // 5. Organization Breakdown
    const orgBreakdownSql = `
      SELECT ORG_TYPE, COUNT(*) AS COUNT
      FROM ORGANIZATION
      GROUP BY ORG_TYPE
      ORDER BY COUNT DESC
    `;
    const orgBreakdownResult = await db.executeQuery(orgBreakdownSql);

    // 6. Recent Transfers (latest 5)
    const recentTransfersSql = `
      SELECT 
        ct.TRANSFER_ID,
        ct.BATCH_ID,
        d.DRUG_NAME,
        f_org.NAME AS FROM_ORG_NAME,
        t_org.NAME AS TO_ORG_NAME,
        TO_CHAR(ct.TRANSFER_DATE, 'YYYY-MM-DD') AS TRANSFER_DATE,
        ct.STATUS
      FROM CUSTODY_TRANSFER ct
      JOIN BATCH b ON ct.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN ORGANIZATION f_org ON ct.FROM_ORG_ID = f_org.ORG_ID
      JOIN ORGANIZATION t_org ON ct.TO_ORG_ID = t_org.ORG_ID
      ORDER BY ct.TRANSFER_ID DESC
      FETCH FIRST 5 ROWS ONLY
    `;
    const recentTransfersResult = await db.executeQuery(recentTransfersSql);

    // 7. Recent Verification Logs (latest 5)
    const recentLogsSql = `
      SELECT 
        vl.LOG_ID,
        vl.BATCH_ID,
        d.DRUG_NAME,
        c.NAME AS CONSUMER_NAME,
        TO_CHAR(vl.SCAN_TIMESTAMP, 'YYYY-MM-DD') AS SCAN_DATE,
        vl.RESULT
      FROM VERIFICATION_LOG vl
      JOIN BATCH b ON vl.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN CONSUMER c ON vl.CONSUMER_ID = c.CONSUMER_ID
      ORDER BY vl.LOG_ID DESC
      FETCH FIRST 5 ROWS ONLY
    `;
    const recentLogsResult = await db.executeQuery(recentLogsSql);

    return res.json({
      success: true,
      tableCounts,
      batchMetrics: batchResult.rows[0],
      complianceMetrics: complianceResult.rows[0],
      verificationMetrics: verifResult.rows[0],
      orgBreakdown: orgBreakdownResult.rows,
      recentTransfers: recentTransfersResult.rows,
      recentLogs: recentLogsResult.rows
    });
  } catch (err) {
    console.error('[Dashboard Metrics Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboardMetrics
};
