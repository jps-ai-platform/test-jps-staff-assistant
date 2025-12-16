import * as React from "react";
import {
  makeStyles,
  tokens,
  Text,
  Subtitle1,
  Caption1,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    minHeight: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  logo: {
    height: "24px",
    width: "auto",
    display: "block",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.1,
  },
  content: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
});

type AgentPreviewProps = Record<string, unknown> & {
  children?: React.ReactNode;
};

export function AgentPreview(props: AgentPreviewProps) {
  const styles = useStyles();

  // Supports either:
  // - props.title / props.subtitle
  // - props.agent?.name / props.agent?.description
  const agent = (props.agent as { name?: string; description?: string } | undefined) ?? undefined;

  const title =
    (props.title as string | undefined) ??
    agent?.name ??
    "Ask Jenks AI";

  const subtitle =
    (props.subtitle as string | undefined) ??
    agent?.description ??
    "Jenks Public Schools";

  // Vite copies /public/* to the site root (or BASE_URL root).
  // This fixes broken images when deployed under a sub-path.
  const logoSrc = `${import.meta.env.BASE_URL}JPS_R_216.png`;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <img
          className={styles.logo}
          src={logoSrc}
          alt="Jenks Public Schools"
          onError={(e) => {
            // If the image fails to load, hide it cleanly (avoid broken-image icon)
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />

        <div className={styles.titleBlock}>
          <div style={{ display: "flex", gap: tokens.spacingHorizontalM }}>
            <Text>{subtitle}</Text>
            <Subtitle1>{title}</Subtitle1>
          </div>
          <Caption1>{subtitle}</Caption1>
        </div>
      </div>

      <div className={styles.content}>{props.children}</div>
    </div>
  );
}

export default AgentPreview;
