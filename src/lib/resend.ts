import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAnalysisComplete(params: {
  to: string;
  borrowerName: string;
  dealId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await resend.emails.send({
    from: "LendFlow AI <notifications@lendflow.ai>",
    to: params.to,
    subject: `Analysis complete: ${params.borrowerName}`,
    html: `
      <h2>Credit Analysis Ready</h2>
      <p>The analysis for <strong>${params.borrowerName}</strong> is complete.</p>
      <p><a href="${appUrl}/dashboard/deals/${params.dealId}">View Results →</a></p>
    `,
  });
}

export async function sendReviewNeeded(params: {
  to: string;
  borrowerName: string;
  dealId: string;
  reviewCount: number;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await resend.emails.send({
    from: "LendFlow AI <notifications@lendflow.ai>",
    to: params.to,
    subject: `Review needed: ${params.borrowerName}`,
    html: `
      <h2>Manual Review Required</h2>
      <p>The analysis for <strong>${params.borrowerName}</strong> has <strong>${params.reviewCount} item(s)</strong> that need your review before the analysis can continue.</p>
      <p><a href="${appUrl}/dashboard/deals/${params.dealId}/review">Review Now →</a></p>
    `,
  });
}
