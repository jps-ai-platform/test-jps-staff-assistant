import { Button, Spinner } from "@fluentui/react-components";
import { bundleIcon, DeleteFilled, DeleteRegular } from "@fluentui/react-icons";
import { CopilotMessageV2 as CopilotMessage } from "@fluentui-copilot/react-copilot-chat";
import {
  ReferenceListV2 as ReferenceList,
  ReferenceOverflowButton,
} from "@fluentui-copilot/react-reference";
import { Suspense } from "react";

import { Markdown } from "../core/Markdown";
import { UsageInfo } from "./UsageInfo";
import { IAssistantMessageProps } from "./chatbot/types";

import styles from "./AgentPreviewChatBot.module.css";
import { AgentIcon } from "./AgentIcon";

const DeleteIcon = bundleIcon(DeleteFilled, DeleteRegular);

export function AssistantMessage({
  message,
  agentLogo,
  loadingState,
  agentName,
  showUsageInfo,
  onDelete,
}: IAssistantMessageProps): React.JSX.Element {
  // Whether the message has citations / references attached.
  const hasAnnotations = message.annotations && message.annotations.length > 0;

  const references = hasAnnotations
    ? message.annotations?.map((annotation, index) => (
        <div key={index} className="reference-item">
          {annotation.text || annotation.file_name}
        </div>
      ))
    : [];

  // Use agentLogo if provided; otherwise fall back to your known-good icon in /public
  // NOTE: Because AgentIcon prefixes BASE_URL, pass a leading "/" path for public assets.
  const forcedAvatarIcon =
    agentLogo && agentLogo.trim().length > 0 ? agentLogo : "/jps-chatbot-icon.png";

  /**
   * IMPORTANT:
   * In your current Fluent Copilot component typings, loadingState is:
   *   "none" | "streaming" | undefined
   *
   * So "streaming" is the only "loading" value we can check for without TypeScript errors.
   */
  const isLoading = loadingState === "streaming";

  // If we have no content yet and we are "loading", show a visible progress indicator.
  const hasContent = Boolean(message.content && message.content.trim().length > 0);

  return (
    <CopilotMessage
      id={"msg-" + message.id}
      key={message.id}
      actions={
        <span>
          {onDelete && message.usageInfo && (
            <Button
              appearance="subtle"
              icon={<DeleteIcon />}
              onClick={() => {
                void onDelete(message.id);
              }}
            />
          )}
        </span>
      }
      avatar={<AgentIcon alt="JPS AI Assistant" iconName={forcedAvatarIcon} />}
      className={styles.copilotChatMessage}
      disclaimer={<span>AI-generated content may be incorrect</span>}
      footnote={
        <>
          {hasAnnotations && (
            <ReferenceList
              maxVisibleReferences={3}
              minVisibleReferences={2}
              showLessButton={
                <ReferenceOverflowButton>Show Less</ReferenceOverflowButton>
              }
              showMoreButton={
                <ReferenceOverflowButton
                  text={(overflowCount) => `+${overflowCount.toString()}`}
                />
              }
            >
              {references}
            </ReferenceList>
          )}
          {showUsageInfo && message.usageInfo && (
            <UsageInfo info={message.usageInfo} duration={message.duration} />
          )}
        </>
      }
      loadingState={loadingState}
      name={agentName ?? "Bot"}
    >
      {isLoading && !hasContent ? (
        // Render an explicit "in progress" UI so users always see activity while waiting.
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Spinner size="small" />
          <span>Generating response…</span>
        </span>
      ) : (
        // Normal render path once we have content (or not loading).
        <Suspense fallback={<Spinner size="small" />}>
          <Markdown content={message.content} />
        </Suspense>
      )}
    </CopilotMessage>
  );
}
