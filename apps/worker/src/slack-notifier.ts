/**
 * Slack通知モジュール
 * 環境変数 SLACK_WEBHOOK_URL が設定されている場合のみ通知を送信
 */

interface SlackNotifyOptions {
  projectTitle: string;
  projectCode: string;
  projectId: string;
  status: "completed" | "ready_for_devin" | "failed";
  score: number | null;
  totalSteps: number;
  runtimeSec: number | null;
  loopCount: number;
  appUrl?: string;
}

const STATUS_EMOJI: Record<string, string> = {
  completed: ":white_check_mark:",
  ready_for_devin: ":rocket:",
  failed: ":x:",
};

const STATUS_TEXT: Record<string, string> = {
  completed: "完了",
  ready_for_devin: "Devin実装可能",
  failed: "失敗",
};

export async function sendSlackNotification(opts: SlackNotifyOptions): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Slack] SLACK_WEBHOOK_URL未設定のため通知をスキップ");
    return;
  }

  const emoji = STATUS_EMOJI[opts.status] ?? ":gear:";
  const statusText = STATUS_TEXT[opts.status] ?? opts.status;
  const appUrl = opts.appUrl || process.env.APP_URL || "";
  const projectUrl = appUrl ? `${appUrl}/projects/${opts.projectId}` : "";

  const runtimeText = opts.runtimeSec !== null
    ? `${Math.floor(opts.runtimeSec / 60)}分${opts.runtimeSec % 60}秒`
    : "不明";

  const titleLink = projectUrl
    ? `<${projectUrl}|${opts.projectTitle || "無題の案件"}>`
    : (opts.projectTitle || "無題の案件");

  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} 工場長 - ワークフロー${statusText}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*案件:*\n${titleLink}` },
          { type: "mrkdwn", text: `*コード:*\n${opts.projectCode}` },
          { type: "mrkdwn", text: `*ステータス:*\n${emoji} ${statusText}` },
          { type: "mrkdwn", text: `*スコア:*\n${opts.score !== null ? `${opts.score}/100` : "-"}` },
          { type: "mrkdwn", text: `*実行時間:*\n${runtimeText}` },
          { type: "mrkdwn", text: `*ループ回数:*\n${opts.loopCount}` },
        ],
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[Slack] 通知送信失敗: ${res.status} ${res.statusText}`);
    } else {
      console.log("[Slack] 通知送信完了");
    }
  } catch (error) {
    console.error("[Slack] 通知送信エラー:", error);
  }
}
