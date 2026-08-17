import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type UIMessage,
} from "ai";
import {
  CopyIcon,
  DownloadIcon,
  RefreshCcwIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "~/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "~/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "~/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "~/components/ai-elements/sources";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "~/components/ai-elements/tool";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Marker, MarkerContent, MarkerIcon } from "~/components/ui/marker";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "~/components/ui/message-scroller";
import { Spinner } from "~/components/ui/spinner";

const chatTransport = new DefaultChatTransport({
  api: "/api/chat",
});

function downloadConversation(messages: UIMessage[]) {
  const markdown = messages
    .map((message) => {
      const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
      const text = message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
      return `**${role}:** ${text}`;
    })
    .join("\n\n");
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "conversation.md";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

interface MessagePartsProps {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}

function MessageParts({
  message,
  isLastMessage,
  isStreaming,
}: MessagePartsProps) {
  const sourceParts = message.parts.filter(
    (part) => part.type === "source-url",
  );
  const reasoningParts = message.parts.filter(
    (part) => part.type === "reasoning",
  );
  const reasoningText = reasoningParts.map((part) => part.text).join("\n\n");
  const isReasoningStreaming =
    isLastMessage && isStreaming && message.parts.at(-1)?.type === "reasoning";

  return (
    <>
      {sourceParts.length > 0 && (
        <Sources>
          <SourcesTrigger count={sourceParts.length} />
          <SourcesContent>
            {sourceParts.map((part) => (
              <Source
                href={part.url}
                key={`${message.id}-source-${part.sourceId}`}
                title={part.title ?? part.url}
              />
            ))}
          </SourcesContent>
        </Sources>
      )}

      {reasoningParts.length > 0 && (
        <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      )}

      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;

        if (part.type === "text") {
          return <MessageResponse key={key}>{part.text}</MessageResponse>;
        }

        if (isToolUIPart(part)) {
          const output =
            part.state === "output-available" ? part.output : undefined;
          const errorText =
            part.state === "output-error" ? part.errorText : undefined;

          return (
            <Tool defaultOpen key={key}>
              {part.type === "dynamic-tool" ? (
                <ToolHeader
                  state={part.state}
                  toolName={getToolName(part)}
                  type={part.type}
                />
              ) : (
                <ToolHeader state={part.state} type={part.type} />
              )}
              <ToolContent>
                <ToolInput input={part.input} />
                <ToolOutput errorText={errorText} output={output} />
              </ToolContent>
            </Tool>
          );
        }

        return null;
      })}
    </>
  );
}

interface ChatProps {
  isConfigured: boolean;
}

export default function Chat({ isConfigured }: ChatProps) {
  const [input, setInput] = useState("");
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
    transport: chatTransport,
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!isConfigured || !text || status !== "ready") {
      return;
    }

    sendMessage({ text });
    setInput("");
  };

  const isStreaming = status === "streaming";

  return (
    <div className="flex h-[calc(100svh-8.5rem)] min-h-[32rem] flex-col">
      <MessageScrollerProvider>
        <div className="relative min-h-0 flex-1">
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent
                aria-busy={status === "submitted" || isStreaming}
                className="mx-auto w-full max-w-3xl p-4 pb-16"
              >
                {!isConfigured && (
                  <MessageScrollerItem messageId="configuration">
                    <Alert>
                      <AlertTitle>Connect Azure OpenAI</AlertTitle>
                      <AlertDescription>
                        Add AZURE_OPENAI_RESOURCE_NAME, AZURE_OPENAI_API_KEY and
                        your optional AZURE_OPENAI_DEPLOYMENT_NAME to .env, then
                        restart the development server.
                      </AlertDescription>
                    </Alert>
                  </MessageScrollerItem>
                )}

                {messages.length === 0 ? (
                  <MessageScrollerItem
                    className="flex min-h-[20rem]"
                    messageId="empty"
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <SparklesIcon />
                        </EmptyMedia>
                        <EmptyTitle>How can I help?</EmptyTitle>
                        <EmptyDescription>
                          Ask a question or try the weather tool.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </MessageScrollerItem>
                ) : (
                  messages.map((message, messageIndex) => {
                    const isLastMessage = messageIndex === messages.length - 1;
                    const responseText = message.parts
                      .filter((part) => part.type === "text")
                      .map((part) => part.text)
                      .join("");

                    return (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={message.role === "user"}
                      >
                        <Message from={message.role}>
                          <MessageContent>
                            <MessageParts
                              isLastMessage={isLastMessage}
                              isStreaming={isStreaming}
                              message={message}
                            />
                          </MessageContent>
                        </Message>

                        {message.role === "assistant" &&
                          isLastMessage &&
                          responseText && (
                            <MessageActions>
                              <MessageAction
                                label="Retry response"
                                onClick={() => regenerate()}
                                tooltip="Retry"
                              >
                                <RefreshCcwIcon data-icon="inline-start" />
                              </MessageAction>
                              <MessageAction
                                label="Copy response"
                                onClick={() =>
                                  navigator.clipboard.writeText(responseText)
                                }
                                tooltip="Copy"
                              >
                                <CopyIcon data-icon="inline-start" />
                              </MessageAction>
                            </MessageActions>
                          )}
                      </MessageScrollerItem>
                    );
                  })
                )}

                {status === "submitted" && (
                  <MessageScrollerItem messageId="response-status">
                    <Marker role="status">
                      <MarkerIcon>
                        <Spinner />
                      </MarkerIcon>
                      <MarkerContent className="shimmer">
                        Thinking…
                      </MarkerContent>
                    </Marker>
                  </MessageScrollerItem>
                )}

                {error && (
                  <MessageScrollerItem messageId="response-error">
                    <Alert variant="destructive">
                      <AlertTitle>Message failed</AlertTitle>
                      <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>

          {messages.length > 0 && (
            <Button
              aria-label="Download conversation"
              className="absolute top-2 right-2"
              onClick={() => downloadConversation(messages)}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <DownloadIcon />
            </Button>
          )}
        </div>
      </MessageScrollerProvider>

      <PromptInput className="mx-auto w-full max-w-3xl" onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            disabled={!isConfigured}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder={
              isConfigured
                ? "Ask Rocket anything…"
                : "Configure Azure OpenAI to start chatting"
            }
            value={input}
          />
        </PromptInputBody>
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit
            disabled={!isConfigured || (status === "ready" && !input.trim())}
            onStop={stop}
            status={status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
