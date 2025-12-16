import { ReactNode, useState, useMemo, useEffect } from "react";
import {
  Body1,
  Button,
  Caption1,
  Spinner,
  Title3,
} from "@fluentui/react-components";
import { ChatRegular, MoreHorizontalRegular } from "@fluentui/react-icons";
import clsx from "clsx";

import { AgentIcon } from "./AgentIcon";
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

export function AgentPreview({ agentDetails }: IAgentPreviewProps): ReactNode {
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [messageList, setMessageList] = useState<IChatItem[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(true);

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/chat/history", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const json = await response.json();
        const history: IChatItem[] = [];

        [...json].reverse().forEach((entry: any) => {
          history.push({
            id: crypto.randomUUID(),
            content: entry.content,
            role: entry.role,
            isAnswer: entry.role !== "user",
            more: { time: new Date().toISOString() },
          });
        });

        setMessageList((prev) => [...history, ...prev]);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  const newThread = () => {
    setMessageList([]);
    document.cookie.split(";").forEach((cookie) => {
      document.cookie =
        cookie.split("=")[0] +
        "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  };

  const onSend = async (message: string) => {
    const userMessage: IChatItem = {
      id: crypto.randomUUID(),
      content: message,
      role: "user",
      more: { time: new Date().toISOString() },
    };

    setMessageList((prev) => [...prev, userMessage]);
    setIsResponding(true);

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        credentials: "include",
      });

      if (!response.body) return;
      setIsResponding(false);
    } catch (err) {
      console.error("Chat error:", err);
      setIsResponding(false);
    }
  };

  const chatContext = useMemo(
    () => ({ messageList, isResponding, onSend }),
    [messageList, isResponding]
  );

  const isEmpty = messageList.length === 0;

  const menuItems = [
    {
      key: "settings",
      children: "Settings",
      onClick: () => setIsSettingsPanelOpen(true),
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
  ];

  return (
    <div className={styles.container}>
      <div className={styles.wavesContainer}>
        <Waves paused={!isEmpty} />
      </div>

      {/* ===== TOP BAR (BRANDED) ===== */}
      <div className={styles.topBar}>
        <div className={styles.leftSection}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/JPS_R_216.png"
              alt="Jenks Public Schools"
              style={{ height: 40, width: "auto" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Body1 as="h1" className={styles.agentName}>
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
            icon={<ChatRegular aria-hidden />}
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

      {/* ===== CHAT CONTENT ===== */}
      <div className={styles.content}>
        <div className={styles.chatbot}>
          {isLoadingChatHistory ? (
            <Spinner label="Loading chat history..." />
          ) : (
            <>
              {isEmpty && (
                <div className={styles.emptyChatContainer}>
                  <AgentIcon
                    alt=""
                    iconClassName={styles.emptyStateAgentIcon}
                    iconName={agentDetails.metadata?.logo}
                  />
                  <Caption1 className={styles.agentName}>
                    {agentDetails.name}
                  </Caption1>
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
        onOpenChange={setIsSettingsPanelOpen}
      />
    </div>
  );
}
