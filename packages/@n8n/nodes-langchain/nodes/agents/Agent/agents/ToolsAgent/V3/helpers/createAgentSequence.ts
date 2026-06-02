import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ChatPromptTemplate } from '@langchain/core/prompts';
import { type Runnable, RunnableSequence } from '@langchain/core/runnables';
import { type AgentRunnableSequence, createToolCallingAgent } from '@langchain/classic/agents';
import type { BaseChatMemory } from '@langchain/classic/memory';
import type { DynamicStructuredTool, Tool } from '@langchain/classic/tools';

import type { N8nOutputParser } from '@utils/output_parsers/N8nOutputParser';

import { fixEmptyContentMessage, getAgentStepsParser } from '../../common';

/**
 * Creates an agent sequence with the given configuration.
 * The sequence includes the agent, output parser, and fallback logic.
 *
 * @param model - The primary chat model
 * @param tools - Array of tools available to the agent
 * @param prompt - The prompt template
 * @param _options - Additional options (maxIterations, returnIntermediateSteps)
 * @param outputParser - Optional output parser for structured responses
 * @param memory - Optional memory for conversation context
 * @param fallbackModel - Optional fallback model if primary fails
 * @param forceToolUse - When true, request `tool_choice: 'required'` for the
 *     next model call so the agent always invokes a tool. Useful for
 *     OpenAI-compatible providers where smaller models tend to skip the tool
 *     call when `tool_choice` defaults to `'auto'`.
 * @returns AgentRunnableSequence ready for execution
 */
export function createAgentSequence(
	model: BaseChatModel,
	tools: Array<DynamicStructuredTool | Tool>,
	prompt: ChatPromptTemplate,
	_options: { maxIterations?: number; returnIntermediateSteps?: boolean },
	outputParser?: N8nOutputParser,
	memory?: BaseChatMemory,
	fallbackModel?: BaseChatModel | null,
	forceToolUse?: boolean,
) {
	const agent = createToolCallingAgent({
		llm: bindModelForAgent(model, tools, forceToolUse),
		tools: getAllTools(model, tools),
		prompt,
		streamRunnable: false,
	});

	let fallbackAgent: AgentRunnableSequence | undefined;
	if (fallbackModel) {
		fallbackAgent = createToolCallingAgent({
			llm: bindModelForAgent(fallbackModel, tools, forceToolUse),
			tools: getAllTools(fallbackModel, tools),
			prompt,
			streamRunnable: false,
		});
	}
	const runnableAgent = RunnableSequence.from([
		fallbackAgent ? agent.withFallbacks([fallbackAgent]) : agent,
		getAgentStepsParser(outputParser, memory),
		fixEmptyContentMessage,
	]) as AgentRunnableSequence;

	runnableAgent.singleAction = true;
	runnableAgent.streamRunnable = false;

	return runnableAgent;
}

/**
 * Returns the LLM that will be passed to `createToolCallingAgent`.
 *
 * Without `forceToolUse`, returns the model unchanged so `createToolCallingAgent`
 * keeps doing its own `bindTools(...)` call. With `forceToolUse`, pre-binds the
 * tools together with `tool_choice: 'required'`, which `createToolCallingAgent`
 * detects as a non-`BaseChatModel` runnable and forwards as-is.
 */
function bindModelForAgent(
	model: BaseChatModel,
	tools: Array<DynamicStructuredTool | Tool>,
	forceToolUse?: boolean,
): BaseChatModel | Runnable {
	if (!forceToolUse || !model.bindTools) {
		return model;
	}
	return model.bindTools(getAllTools(model, tools), { tool_choice: 'required' });
}

/**
 * Uses provided tools and tried to get tools from model metadata
 * Some chat model nodes can define built-in tools in their metadata
 */
function getAllTools(model: BaseChatModel, tools: Array<DynamicStructuredTool | Tool>) {
	const modelTools = (model.metadata?.tools as Tool[]) ?? [];
	const allTools = [...tools, ...modelTools];
	return allTools;
}
