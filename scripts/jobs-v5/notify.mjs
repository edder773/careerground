import { V5Error } from './contracts.mjs';

export function buildNotificationPreview(manifest, { dryRun = false } = {}) {
  if (manifest.status !== 'PUBLISHED' && !(dryRun && manifest.status === 'VERIFIED')) {
    throw new V5Error(
      'NOTIFICATION_REQUIRES_PUBLISHED',
      'Slack notification only accepts a PUBLISHED run.',
      'FAILED_NOTIFICATION',
    );
  }
  const label = manifest.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRY-RUN PREVIEW';
  const outcome =
    manifest.resultStatus ||
    (manifest.counts.new + manifest.counts.changed + manifest.counts.ended > 0
      ? 'SUCCESS_WITH_CHANGES'
      : 'SUCCESS_NO_CHANGES');
  return {
    text: `[${label}] CareerGround ${manifest.targetAsOfDate}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${manifest.targetAsOfDate} CareerGround 채용 자동화` },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*runId* \`${manifest.runId}\`\n*상태* ${label} · ${outcome}`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*신규*\n${manifest.counts.new}` },
          { type: 'mrkdwn', text: `*변경*\n${manifest.counts.changed}` },
          { type: 'mrkdwn', text: `*종료*\n${manifest.counts.ended}` },
          { type: 'mrkdwn', text: `*제외*\n${manifest.counts.excluded}` },
          { type: 'mrkdwn', text: `*활성 공고*\n${manifest.counts.active}` },
          { type: 'mrkdwn', text: `*DB 게시*\n${manifest.db.status}` },
        ],
      },
    ],
  };
}

export async function notifyPublishedRun(manifest, { send }) {
  if (manifest.status !== 'PUBLISHED')
    throw new V5Error(
      'NOTIFICATION_REQUIRES_PUBLISHED',
      'Only PUBLISHED runs may be sent.',
      'FAILED_NOTIFICATION',
    );
  if (typeof send !== 'function')
    throw new V5Error(
      'NOTIFICATION_TRANSPORT_MISSING',
      'A notification transport is required.',
      'FAILED_NOTIFICATION',
    );
  const payload = buildNotificationPreview(manifest);
  try {
    await send(payload);
    return { status: 'SENT', retryPending: false, payload };
  } catch (error) {
    return {
      status: 'FAILED',
      retryPending: true,
      errorCode: 'SLACK_SEND_FAILED',
      errorMessage: String(error),
    };
  }
}
