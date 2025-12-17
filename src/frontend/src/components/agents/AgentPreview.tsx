import { ReactNode, useState, useMemo, useEffect } from "react";
import { Body1, Button, Caption1, Spinner, Title3 } from "@fluentui/react-components";
import { ChatRegular, MoreHorizontalRegular } from "@fluentui/react-icons";

import { SettingsPanel } from "../core/SettingsPanel";
import { AgentPreviewChatBot } from "./AgentPreviewChatBot";
import { MenuButton } from "../core/MenuButton/MenuButton";
import { IChatItem } from "./chatbot/types";
import { Waves } from "./Waves";

/* temporarily disable BuiltWithBadge */
// import { BuiltWithBadge } from "./BuiltWithBadge";

import styles from "./AgentPreview.module.css";

interface IAgent {
  id: string;
  object: string;
  created_at: number;
  name: string;
  description?: string | null;
  model: string;
  instructions?: string;
  tools?: Array<{ type: string }>;
  top_p?: number;
  temperature?: number;
  tool_resources?: {
    file_search?: {
      vector_store_ids?: string[];
    };
    [key: string]: any;
  };
  metadata?: Record<string, any>;
  response_format?: "auto" | string;
}

interface IAgentPreviewProps {
  resourceId: string;
  agentDetails: IAgent;
}

interface IAnnotation {
  label: string;
  index: number;
}

const preprocessContent = (
  content: string,
  annotations?: IAnnotation[]
): string => {
  if (!annotations || annotations.length === 0) {
    return content;
  }

  let processedContent = content;
  annotations
    .slice()
    .sort((a, b) => {
      if (b.index !== a.index) {
        return b.index - a.index;
      }
      return b.label.localeCompare(a.label);
    })
    .filter(
      (annotation, index, self) =>
        index ===
        self.findIndex(
          (a) => a.label === annotation.label && a.index === annotation.index
        )
    )
    .forEach((annotation) => {
      if (annotation.index >= 0 && annotation.index <= processedContent.length) {
        processedContent =
          processedContent.slice(0, annotation.index + 1) +
          ` [${annotation.label}]` +
          processedContent.slice(annotation.index + 1);
      }
    });

  return processedContent;
};

const formatTimestampToLocalTime = (timestampStr: string): string => {
  let localTime = new Date().toLocaleString();
  if (timestampStr) {
    try {
      const timestamp = parseFloat(timestampStr);
      if (!isNaN(timestamp)) {
        const date = new Date(timestamp * 1000);
        localTime =
          date.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          }) +
          ", " +
          date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
      }
    } catch (e) {
      console.error("Error parsing timestamp:", e);
    }
  }
  return localTime;
};

export function AgentPreview({ agentDetails }: IAgentPreviewProps): ReactNode {
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [messageList, setMessageList] = useState<IChatItem[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(true);

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/chat/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const json_response: Array<{
          role: string;
          content: string;
          created_at: string;
          annotations?: IAnnotation[];
        }> = await response.json();

        const historyMessages: IChatItem[] = [];
        const reversedResponse = [...json_response].reverse();

        for (const entry of reversedResponse) {
          const localTime = formatTimestampToLocalTime(entry.created_at);

          if (entry.role === "user") {
            historyMessages.push({
              id: crypto.randomUUID(),
              content: entry.content,
              role: "user",
              more: { time: localTime },
            });
          } else {
            historyMessages.push({
              id: `assistant-hist-${Date.now()}-${Math.random()}`,
              content: preprocessContent(entry.content, entry.annotations),
              role: "assistant",
              isAnswer: true,
              more: { time: localTime },
            });
          }
        }

        setMessageList((prev) => [...historyMessages, ...prev]);
      } else {
        const errorMessage: IChatItem = {
          id: crypto.randomUUID(),
          content: "Error occurs while loading chat history!",
          isAnswer: true,
          more: { time: new Date().toISOString() },
        };
        setMessageList((prev) => [...prev, errorMessage]);
      }

      setIsLoadingChatHistory(false);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      const errorMessage: IChatItem = {
        id: crypto.randomUUID(),
        content: "Error occurs while loading chat history!",
        isAnswer: true,
        more: { time: new Date().toISOString() },
      };
      setMessageList((prev) => [...prev, errorMessage]);
      setIsLoadingChatHistory(false);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  const handleSettingsPanelOpenChange = (isOpen: boolean) => {
    setIsSettingsPanelOpen(isOpen);
  };

  const newThread = () => {
    setMessageList([]);
    deleteAllCookies();
  };

  const deleteAllCookies = (): void => {
    document.cookie.split(";").forEach((cookieStr: string) => {
      const trimmedCookieStr = cookieStr.trim();
      const eqPos = trimmedCookieStr.indexOf("=");
      const name =
        eqPos > -1 ? trimmedCookieStr.substring(0, eqPos) : trimmedCookieStr;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  };

  const onSend = async (message: string) => {
    const userMessage: IChatItem = {
      id: `user-${Date.now()}`,
      content: message,
      role: "user",
      more: { time: new Date().toISOString() },
    };

    setMessageList((prev) => [...prev, userMessage]);

    try {
      const postData = { message: message };

      setIsResponding(true);
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
        credentials: "include",
      });

      console.log(
        "[ChatClient] Response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        console.error(
          "[ChatClient] Response not OK:",
          response.status,
          response.statusText
        );
        setIsResponding(false);
        return;
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported or response.body is null");
      }

      console.log("[ChatClient] Starting to handle streaming response...");
      handleMessages(response.body);
    } catch (error: any) {
      setIsResponding(false);
      if (error.name === "AbortError") {
        console.log("[ChatClient] Fetch request aborted by user.");
      } else {
        console.error("[ChatClient] Fetch failed:", error);
      }
    }
  };

  const handleMessages = (
    stream: ReadableStream<Uint8Array<ArrayBufferLike>>
  ) => {
    let chatItem: IChatItem | null = null;
    let accumulatedContent = "";
    let isStreaming = true;
    let buffer = "";
    let annotations: IAnnotation[] = [];
    let hasReceivedCompletedMessage = false;

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    const readStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[ChatClient] SSE stream ended by server.");
          break;
        }

        const textChunk = decoder.decode(value, { stream: true });
        console.log("[ChatClient] Raw chunk from stream:", textChunk);

        buffer += textChunk;
        let boundary = buffer.indexOf("\n");

        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);

          console.log("[ChatClient] SSE line:", chunk);

          if (chunk.startsWith("data: ")) {
            const jsonStr = chunk.slice(6);
            let data: any;
            try {
              data = JSON.parse(jsonStr);
            } catch (err) {
              console.error("[ChatClient] Failed to parse JSON:", jsonStr, err);
              boundary = buffer.indexOf("\n");
              continue;
            }

            console.log("[ChatClient] Parsed SSE event:", data);

            if (data.type === "stream_end") {
              console.log("[ChatClient] Stream end marker received.");
              setIsResponding(false);
              break;
            } else if (data.type === "thread_run") {
              console.log("[ChatClient] Run status info:", data.content);
            } else {
              if (!chatItem) {
                chatItem = createAssistantMessageDiv();
                console.log("[ChatClient] Created new messageDiv for assistant.");
              }

              if (data.type === "completed_message") {
                if (hasReceivedCompletedMessage) {
                  chatItem = createAssistantMessageDiv();
                  console.log(
                    "[ChatClient] Created new messageDiv for additional completed message."
                  );
                  accumulatedContent = data.content;
                  annotations = data.annotations || [];
                } else {
                  clearAssistantMessage(chatItem);
                  accumulatedContent = data.content;
                  annotations = data.annotations || [];
                  hasReceivedCompletedMessage = true;
                }

                console.log(
                  "[ChatClient] Received completed message:",
                  accumulatedContent
                );

                isStreaming = false;
                setIsResponding(false);
              } else {
                if (hasReceivedCompletedMessage) {
                  chatItem = createAssistantMessageDiv();
                  console.log(
                    "[ChatClient] Created new messageDiv for streaming after completed message."
                  );
                  annotations = [];
                  accumulatedContent = "";
                  hasReceivedCompletedMessage = false;
                }
                accumulatedContent += data.content;
                isStreaming = true;

                console.log(
                  "[ChatClient] Received streaming chunk:",
                  data.content
                );
              }

              appendAssistantMessage(
                chatItem,
                accumulatedContent,
                isStreaming,
                annotations
              );
            }
          }

          boundary = buffer.indexOf("\n");
        }
      }
    };

    readStream().catch((error) => {
      console.error("[ChatClient] Stream reading failed:", error);
    });
  };

  const createAssistantMessageDiv: () => IChatItem = () => {
    const item: IChatItem = {
      id: crypto.randomUUID(),
      content: "",
      isAnswer: true,
      more: { time: new Date().toISOString() },
    };
    setMessageList((prev) => [...prev, item]);
    return item;
  };

  const appendAssistantMessage = (
    chatItem: IChatItem,
    accumulatedContent: string,
    isStreaming: boolean,
    annotations?: IAnnotation[]
  ) => {
    try {
      const preprocessedContent = preprocessContent(
        accumulatedContent,
        annotations
      );

      chatItem.content = preprocessedContent;

      setMessageList((prev) => {
        return [...prev.slice(0, -1), { ...chatItem }];
      });

      if (!isStreaming) {
        requestAnimationFrame(() => {
          const lastChild = document.getElementById(`msg-${chatItem.id}`);
          if (lastChild) {
            lastChild.scrollIntoView({ behavior: "smooth", block: "end" });
          }
        });
      }
    } catch (error) {
      console.error("Error in appendAssistantMessage:", error);
    }
  };

  const clearAssistantMessage = (chatItem: IChatItem) => {
    if (chatItem) {
      chatItem.content = "";
    }
  };

  const menuItems = [
    {
      key: "settings",
      children: "Settings",
      onClick: () => {
        setIsSettingsPanelOpen(true);
      },
    },
    {
      key: "terms",
      children: (
        <a
          className={styles.externalLink}
          href="https://aka.ms/aistudio/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Use
        </a>
      ),
    },
    {
      key: "privacy",
      children: (
        <a
          className={styles.externalLink}
          href="https://go.microsoft.com/fwlink/?linkid=521839"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy
        </a>
      ),
    },
    {
      key: "feedback",
      children: "Send Feedback",
      onClick: () => {
        alert("Thank you for your feedback!");
      },
    },
  ];

  const chatContext = useMemo(
    () => ({
      messageList,
      isResponding,
      onSend,
    }),
    [messageList, isResponding]
  );

  const isEmpty = (messageList?.length ?? 0) === 0;

  return (
    <div className={styles.container}>
      <div className={styles.wavesContainer}>
        <Waves paused={!isEmpty} />
      </div>

      <div className={styles.topBar}>
        {/* ===== BRANDED LEFT SECTION ===== */}
        <div className={styles.leftSection}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={`${import.meta.env.BASE_URL}JPS_R_216.png`}
              alt="Jenks Public Schools"
              style={{ height: 40, width: "auto", display: "block" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Body1 as="h1" className={styles.agentName} style={{ margin: 0 }}>
                Ask Jenks AI
              </Body1>
              <Caption1 style={{ color: "#666" }}>
                Jenks Public Schools
              </Caption1>
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <Button
            appearance="subtle"
            icon={<ChatRegular aria-hidden={true} />}
            onClick={newThread}
          >
            New Chat
          </Button>
          <MenuButton
            menuButtonText=""
            menuItems={menuItems}
            menuButtonProps={{
              appearance: "subtle",
              icon: <MoreHorizontalRegular />,
              "aria-label": "Settings",
            }}
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.chatbot}>
          {isLoadingChatHistory ? (
            <Spinner label={"Loading chat history..."} />
          ) : (
            <>
              {isEmpty && (
                <div className={styles.emptyChatContainer}>
                  <Title3 style={{ marginBottom: 8 }}>
                    Hi, I’m your JPS AI Assistant
                  </Title3>

                  {/* <Caption1 className={styles.agentName}>
                    {agentDetails.name}
                  </Caption1> */}

                  <Title3>How can I help you today?</Title3>
                </div>
              )}

              <AgentPreviewChatBot
                agentName={agentDetails.name}
                agentLogo={agentDetails.metadata?.logo}
                chatContext={chatContext}
              />
            </>
          )}
        </div>
      </div>


      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onOpenChange={handleSettingsPanelOpenChange}
      />
    </div>
  );
}
