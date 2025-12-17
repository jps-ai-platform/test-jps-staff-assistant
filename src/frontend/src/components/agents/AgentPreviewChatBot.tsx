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

  // Source-of-truth message list comes from chatContext
  const messageListFromChatContext = useMemo(
    () => chatContext.messageList ?? [],
    [chatContext.messageList]
  );

  // Allows editing a previous USER message (non-answer)
  const onEditMessage = (messageId: string) => {
    const selectedMessage = messageListFromChatContext.find(
      (message) => !message.isAnswer && message.id === messageId
    )?.content;

    setCurrentUserMessage(selectedMessage);
  };

  const isEmpty = messageListFromChatContext.length === 0;

  // True while the backend/model is generating a response
  const isResponding = Boolean(chatContext.isResponding);

  // Used to determine whether we need a temporary loading bubble
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
                  loadingState={
                    isLastMessage && isResponding ? "streaming" : "none"
                  }
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
            If we are responding but the last message is not an assistant message yet,
            render a temporary assistant "loading" bubble so the user immediately sees
            activity after submitting a prompt.
          */}
          {isResponding && !lastMessageIsAssistant && (
            <AssistantMessage
              key="assistant-loading-placeholder"
              agentLogo={agentLogo}
              agentName={agentName}
              loadingState="streaming"
              message={
                {
                  id: "assistant-loading-placeholder",
                  isAnswer: true,
                  content: "",
                  annotations: [],
                } as any
              }
            />
          )}
        </div>
      ) : (
        /* Empty div needed for proper animation when transitioning to non-empty state */
        <div />
      )}

      <div className={styles.inputContainer}>
        <ChatInput
          currentUserMessage={currentUserMessage}
          isGenerating={isResponding}
          onSubmit={chatContext.onSend}
        />
      </div>
    </div>
  );
}
