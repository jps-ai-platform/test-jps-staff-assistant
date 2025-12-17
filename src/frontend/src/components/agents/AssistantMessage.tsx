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
  const hasAnnotations = message.annotations && message.annotations.length > 0;

  const references = hasAnnotations
    ? message.annotations?.map((annotation, index) => (
        <div key={index} className="reference-item">
          {annotation.text || annotation.file_name}
        </div>
      ))
    : [];

  const forcedAvatarIcon =
    agentLogo && agentLogo.trim().length > 0 ? agentLogo : "/jps-chatbot-icon.png";

  // Adjust this check if your loadingState enum differs.
  const isLoading =
    loadingState === "loading" ||
    loadingState === "pending" ||
    loadingState === "generating";

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
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Spinner size="small" />
          <span>Generating response…</span>
        </span>
      ) : (
        <Suspense fallback={<Spinner size="small" />}>
          <Markdown content={message.content} />
        </Suspense>
      )}
    </CopilotMessage>
  );
}
