import { autoSaveHighlightedDataProperty } from 'n8n-nodes-base/dist/utils/highlightedData';
import type { INodeProperties } from 'n8n-workflow';

import { getBatchingOptionFields } from '@n8n/ai-utilities';

import { commonOptions } from '../options';

const enableStreaminOption: INodeProperties = {
	displayName: 'Enable Streaming',
	name: 'enableStreaming',
	type: 'boolean',
	default: true,
	description: 'Whether this agent will stream the response in real-time as it generates text',
};

const forceFirstToolCallOption: INodeProperties = {
	displayName: 'Force First Tool Call',
	name: 'forceFirstToolCall',
	type: 'boolean',
	default: false,
	description:
		'Whether to send tool_choice "required" on the first iteration so the agent always invokes a tool. Helps with OpenAI-compatible providers serving smaller models that otherwise default to text completion.',
};

const maxTokensFromMemoryOption: INodeProperties = {
	displayName: 'Max Tokens To Read From Memory',
	name: 'maxTokensFromMemory',
	type: 'hidden',
	default: 0,
	description:
		'The maximum number of tokens to read from the chat memory history. Set to 0 to read all history.',
};

export const toolsAgentProperties: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	type: 'collection',
	default: {},
	placeholder: 'Add Option',
	options: [
		...commonOptions,
		autoSaveHighlightedDataProperty,
		enableStreaminOption,
		forceFirstToolCallOption,
		getBatchingOptionFields(undefined, 1),
		maxTokensFromMemoryOption,
	],
};
