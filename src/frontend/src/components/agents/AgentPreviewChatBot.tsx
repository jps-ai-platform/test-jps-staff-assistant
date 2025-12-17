import React, { useState, useMemo } from "react";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";
import { ChatInput } from "./chatbot/ChatInput";
import { AgentPreviewChatBotProps } from "./chatbot/types";

import styles from "./AgentPreviewChatBot.module.css";
import clsx from "clsx";

export function AgentPreviewChatBot({
  agentName,
  agentLogo,
  chatContext,
}: AgentPreviewChatBotProps): React.JSX.Element {
  const [currentUserMessage, setCurrentUserMessage] = useState<string | undefined>();

  // Source-of-truth message list comes from chatContext (likely managed by a hook / parent).
  // We memoize just to avoid re-renders when reference doesn't change.
  const messageListFromChatContext = useMemo(
    () => chatContext.messageList ?? [],
    [chatContext.messageList]
  );

  // Allows user to click/edit a previous user message (non-answer).
  const onEditMessage = (messageId: string) => {
    const selectedMessage = messageListFromChatContext.find(
      (message) => !message.isAnswer && message.id === messageId
    )?.content;

    setCurrentUserMessage(selectedMessage);
  };

  const isEmpty = messageListFromChatContext.length === 0;

  // Convenience: determine whether we are currently waiting on the model/backend.
  const isResponding = Boolean(chatContext.isResponding);

  // Identify whether the last message in the list is an assistant answer.
  // If not, and we are responding, we can render a temporary "loading" assistant bubble
  // so the UI ALWAYS shows progress immediately after submit.
  const lastMessage = messageListFromChatContext[messageListFromChatContext.length - 1];
  const lastMessageIsAssistant = Boolean(lastMessage?.isAnswer);

  return (
    <div
      className={clsx(
        styles.chatContainer,
        isEmpty ? styles.emptyChatContainer : undefined
      )}
    >
      {!isEmpty ? (
        <div className={styles.copilotChatContainer}>
          {messageListFromChatContext.map((message, index, messageList) => {
            const isLastMessage = index === messageList.length - 1;

            if (message.isAnswer) {
              return (
                <AssistantMessage
                  key={message.id}
                  agentLogo={agentLogo}
                  agentName={agentName}
                  message={message}
                  // IMPORTANT:
                  // Only mark the *last assistant message* as loading while responding.
                  // This allows AssistantMessage.tsx to show the spinner/progress text you added.
                  loadingState={isLastMessage && isResponding ? "loading" : "none"}
                />
              );
            }

            return (
              <UserMessage
                key={message.id}
                message={message}
                onEditMessage={onEditMessage}
              />
            );
          })}

          {/* 
            If we are responding but the last message in the list is NOT an assistant message yet,
            render a temporary loading bubble. This covers the common case where:
              - user message is appended immediately
              - backend call is in-flight
              - assistant response hasn't been appended to messageList yet
            Without this, the user can see "nothing happening" after submit.
          */}
          {isResponding && !lastMessageIsAssistant && (
            <AssistantMessage
              key="assistant-loading-placeholder"
              agentLogo={agentLogo}
              agentName={agentName}
              // Minimal "message" shape: AssistantMessage expects a message prop.
              // We provide a placeholder with an id and empty content so it shows the progress UI.
              message={{
                id: "assistant-loading-placeholder",
                // Match your message model expectations:
                // Assistant messages have isAnswer=true in your codebase.
                isAnswer: true,
                content: "",
                annotations: [],
                // If your message type includes usageInfo/duration, you can omit or set undefined.
                // usageInfo: undefined,
                // duration: undefined,
              } as any}
              loadingState="loading"
            />
          )}
        </div>
      ) : (
        // Empty div needed for proper animation when transitioning to non-empty state
        <div />
      )}

      <div className={styles.inputContainer}>
        <ChatInput
          currentUserMessage={currentUserMessage}
          // Disable input/button while generating to prevent double submits.
          isGenerating={isResponding}
          // The actual send handler lives on chatContext.
          onSubmit={chatContext.onSend}
        />
      </div>
    </div>
  );
}
