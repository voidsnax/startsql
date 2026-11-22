import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { SQL_KEYWORDS, SQL_TYPES, SQL_FUNCTIONS } from "../lib/sqlVocabulary";

/** Renders `code` spans inside a plain string without block markdown. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="md-inline-code">
            {part}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// highlight.js passes its grammar builder in untyped; `any` is the honest boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sqlLanguage(hljs: any) {
  return {
    name: "SQL",
    case_insensitive: true,
    keywords: {
      keyword: SQL_KEYWORDS,
      literal: "null true false",
      type: SQL_TYPES,
      built_in: SQL_FUNCTIONS,
    },
    contains: [
      hljs.COMMENT("--", "$"),
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: "string",
        begin: "'",
        end: "'",
        contains: [{ begin: "''" }],
        relevance: 0,
      },
      { className: "number", begin: "\\b\\d+(\\.\\d+)?\\b", relevance: 0 },
      { className: "operator", begin: "(?:\\|\\||[+*/%<>=!~&|-])", relevance: 0 },
    ],
  };
}

const components: Components = {
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children }) {
    if (!className) {
      return <code className="md-inline-code">{children}</code>;
    }
    return (
      <pre className="md-code-block">
        <code className={className}>{children}</code>
      </pre>
    );
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { languages: { sql: sqlLanguage } }]]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}