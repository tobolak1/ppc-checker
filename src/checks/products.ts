import {
  MerchantAccountContext, CheckFinding, CheckThresholds,
  MerchantProduct, MerchantFeedDiagnostics, MerchantAccountIssues,
} from "./types";

export async function checkProducts(
  merchant: MerchantAccountContext,
  thresholds?: CheckThresholds
): Promise<CheckFinding[]> {
  const findings: CheckFinding[] = [];

  if (!merchant.feedUrl && !merchant.externalId) {
    findings.push({
      checkId: "mc-no-credentials",
      severity: "INFO",
      title: `No Merchant Center configured for ${merchant.name}`,
      message: `Connect Merchant Center API credentials to enable product monitoring.`,
    });
    return findings;
  }

  const products = await fetchProducts(merchant);
  const feedDiag = await fetchFeedDiagnostics(merchant);
  const accountIssues = await fetchAccountIssues(merchant);

  // mc-disapproved: Disapproved products > 5%
  const disapprovedPct = (thresholds?.disapprovedPct as number) ?? 5;
  const disapproved = products.filter((p) => p.status === "DISAPPROVED");
  if (products.length > 0 && (disapproved.length / products.length) * 100 > disapprovedPct) {
    findings.push({
      checkId: "mc-disapproved",
      severity: "CRITICAL",
      title: `${disapproved.length} disapproved products (${((disapproved.length / products.length) * 100).toFixed(1)}%)`,
      message: `More than ${disapprovedPct}% of products are DISAPPROVED in ${merchant.name}.`,
      data: {
        total: products.length,
        disapproved: disapproved.length,
        examples: disapproved.slice(0, 10).map((p) => ({ id: p.id, title: p.title })),
      },
    });
  }

  // mc-expiring: Products expiring within 3 days
  const expiryDays = (thresholds?.productExpiryDays as number) ?? 3;
  const now = Date.now();
  const expiring = products.filter((p) => {
    if (!p.expirationDate) return false;
    const daysLeft = (new Date(p.expirationDate).getTime() - now) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= expiryDays;
  });
  if (expiring.length > 0) {
    findings.push({
      checkId: "mc-expiring",
      severity: "HIGH",
      title: `${expiring.length} product(s) expiring within ${expiryDays} days`,
      message: `Products will become unavailable if feed is not updated.`,
      data: { products: expiring.slice(0, 10).map((p) => ({ id: p.id, title: p.title, expires: p.expirationDate })) },
    });
  }

  // mc-feed-errors: Feed processing errors > 0
  if (feedDiag && feedDiag.processingErrors > 0) {
    findings.push({
      checkId: "mc-feed-errors",
      severity: "HIGH",
      title: `${feedDiag.processingErrors} feed processing error(s)`,
      message: `Feed for ${merchant.name} has processing errors that may prevent products from being listed.`,
      data: { errors: feedDiag.processingErrors, warnings: feedDiag.validationWarnings },
    });
  }

  // mc-price-mismatch: Feed price != web price
  const priceMismatches = products.filter(
    (p) => p.webPrice !== undefined && Math.abs(p.feedPrice - p.webPrice) > 0.01
  );
  if (priceMismatches.length > 0) {
    findings.push({
      checkId: "mc-price-mismatch",
      severity: "CRITICAL",
      title: `${priceMismatches.length} product(s) with price mismatch`,
      message: `Feed prices don't match website prices. This can cause disapprovals.`,
      data: {
        products: priceMismatches.slice(0, 10).map((p) => ({
          id: p.id, title: p.title, feedPrice: p.feedPrice, webPrice: p.webPrice,
        })),
      },
    });
  }

  // mc-account-issues: Account-level warnings or suspensions
  if (accountIssues.length > 0) {
    const critical = accountIssues.filter((i) => i.severity === "CRITICAL" || i.severity === "ERROR");
    if (critical.length > 0) {
      findings.push({
        checkId: "mc-account-issues",
        severity: "CRITICAL",
        title: `${critical.length} account-level issue(s) in ${merchant.name}`,
        message: `Merchant Center account has critical issues that may affect all products.`,
        data: { issues: critical },
      });
    }
  }

  // mc-pending-spike: Pending products increased by 20%+
  const pendingSpikePct = (thresholds?.pendingSpikePct as number) ?? 20;
  const pending = products.filter((p) => p.status === "PENDING");
  if (pending.length > products.length * (pendingSpikePct / 100)) {
    findings.push({
      checkId: "mc-pending-spike",
      severity: "MEDIUM",
      title: `High number of pending products: ${pending.length}`,
      message: `${((pending.length / products.length) * 100).toFixed(1)}% of products are PENDING review.`,
      data: { total: products.length, pending: pending.length },
    });
  }

  // mc-availability: in_stock in feed but out_of_stock on web
  const availabilityMismatch = products.filter(
    (p) => p.availability === "in_stock" && p.webAvailability === "out_of_stock"
  );
  if (availabilityMismatch.length > 0) {
    findings.push({
      checkId: "mc-availability",
      severity: "HIGH",
      title: `${availabilityMismatch.length} product(s) with availability mismatch`,
      message: `Products marked as in_stock in feed but out_of_stock on website.`,
      data: {
        products: availabilityMismatch.slice(0, 10).map((p) => ({ id: p.id, title: p.title })),
      },
    });
  }

  return findings;
}

async function fetchProducts(_merchant: MerchantAccountContext): Promise<MerchantProduct[]> {
  return [];
}

async function fetchFeedDiagnostics(_merchant: MerchantAccountContext): Promise<MerchantFeedDiagnostics | null> {
  return null;
}

async function fetchAccountIssues(_merchant: MerchantAccountContext): Promise<MerchantAccountIssues[]> {
  return [];
}
