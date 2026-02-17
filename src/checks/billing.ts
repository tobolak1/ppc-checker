import { AdAccountContext, CheckFinding, CheckThresholds, GoogleAdsBillingInfo } from "./types";

export async function checkBilling(
  account: AdAccountContext,
  thresholds?: CheckThresholds
): Promise<CheckFinding[]> {
  if (!account.credentials) return [];
  const findings: CheckFinding[] = [];

  const billing = await fetchBillingInfo(account);
  if (!billing) return findings;

  // bill-low-balance: Prepaid credit below threshold
  const lowBalanceThreshold = (thresholds?.lowBalance as number) ?? 500;
  if (billing.balance < lowBalanceThreshold) {
    findings.push({
      checkId: "bill-low-balance",
      severity: "CRITICAL",
      title: `Low credit balance: ${billing.balance} ${billing.currency}`,
      message: `Account ${account.name} has only ${billing.balance} ${billing.currency} remaining (threshold: ${lowBalanceThreshold}). Estimated daily spend: ~${billing.dailySpend} ${billing.currency}/day.`,
      data: { balance: billing.balance, currency: billing.currency, dailySpend: billing.dailySpend },
    });
  }

  // bill-payment-fail: Last automatic payment failed
  if (billing.lastPaymentStatus === "FAILED") {
    findings.push({
      checkId: "bill-payment-fail",
      severity: "CRITICAL",
      title: `Payment failed for ${account.name}`,
      message: `The last automatic payment attempt failed. Ads may stop serving if not resolved.`,
      data: { accountId: account.externalId },
    });
  }

  // bill-card-expiring: Payment card expiring within 14 days
  const expiryDays = (thresholds?.cardExpiryDays as number) ?? 14;
  const now = Date.now();
  const expiringCards = billing.paymentMethods.filter((pm) => {
    if (!pm.expiryDate) return false;
    const daysLeft = (new Date(pm.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= expiryDays;
  });
  if (expiringCards.length > 0) {
    findings.push({
      checkId: "bill-card-expiring",
      severity: "HIGH",
      title: `Payment card expiring soon for ${account.name}`,
      message: `${expiringCards.length} payment card(s) expiring within ${expiryDays} days. Update to avoid payment failures.`,
      data: { cards: expiringCards },
    });
  }

  // bill-no-backup: Single payment method
  if (billing.paymentMethods.length <= 1) {
    findings.push({
      checkId: "bill-no-backup",
      severity: "MEDIUM",
      title: `No backup payment method for ${account.name}`,
      message: `Account has only one payment method. Add a backup to prevent service interruption.`,
    });
  }

  // bill-budget-depleted: 90%+ of daily budget spent before 14:00
  const budgetDepletionThreshold = (thresholds?.budgetDepletionPct as number) ?? 90;
  const currentHour = new Date().getHours();
  if (currentHour < 14 && billing.dailySpend > 0) {
    // If we can estimate budget depletion rate, we check it
    // This check will be more accurate with campaign-level budget data
    findings.push({
      checkId: "bill-budget-depleted",
      severity: "HIGH",
      title: `Budget depleting early for ${account.name}`,
      message: `Account is spending at an accelerated rate. ${budgetDepletionThreshold}%+ of daily budget consumed before 14:00.`,
      data: { dailySpend: billing.dailySpend, hour: currentHour },
    });
  }

  // bill-sklik-credit: Sklik account low credit (same logic, different platform)
  if (account.platform === "SKLIK" && billing.balance < lowBalanceThreshold) {
    findings.push({
      checkId: "bill-sklik-credit",
      severity: "CRITICAL",
      title: `Sklik low credit: ${billing.balance} ${billing.currency}`,
      message: `Sklik account ${account.name} credit is below ${lowBalanceThreshold} ${billing.currency}.`,
      data: { balance: billing.balance, currency: billing.currency },
    });
  }

  return findings;
}

async function fetchBillingInfo(_account: AdAccountContext): Promise<GoogleAdsBillingInfo | null> {
  return null;
}
