import { createToolCallingAgent } from '@langchain/classic/agents';
import type { Tool } from '@langchain/classic/tools';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import type { Mock } from 'vitest';
import { mock } from 'vitest-mock-extended';

import * as commonHelpers from '../../../common';
import { createAgentSequence } from '../createAgentSequence';

vi.mock('@langchain/classic/agents', () => ({
	createToolCallingAgent: vi.fn(),
}));

vi.mock('@langchain/core/runnables', () => ({
	RunnableSequence: {
		from: vi.fn(),
	},
}));

vi.mock('../../../common', () => ({
	getAgentStepsParser: vi.fn(),
	fixEmptyContentMessage: vi.fn(),
}));

describe('createAgentSequence', () => {
	const mockModel = mock<BaseChatModel>();
	const mockPrompt = mock<ChatPromptTemplate>();
	const mockTool = mock<Tool>();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create agent sequence without fallback', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockStepsParser = vi.fn();

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		const result = createAgentSequence(mockModel, [mockTool], mockPrompt, options);

		expect(createToolCallingAgent).toHaveBeenCalledWith({
			llm: mockModel,
			tools: [mockTool],
			prompt: mockPrompt,
			streamRunnable: false,
		});

		expect(RunnableSequence.from).toHaveBeenCalledWith([
			mockAgent,
			mockStepsParser,
			commonHelpers.fixEmptyContentMessage,
		]);

		expect(result.singleAction).toBe(true);
		expect(result.streamRunnable).toBe(false);
	});

	it('should create agent sequence with fallback model', () => {
		const mockFallbackModel = mock<BaseChatModel>();
		const mockAgent = mock<any>();
		const mockFallbackAgent = mock<any>();
		const mockAgentWithFallback = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockStepsParser = vi.fn();

		mockAgent.withFallbacks = vi.fn().mockReturnValue(mockAgentWithFallback);

		(createToolCallingAgent as Mock)
			.mockReturnValueOnce(mockAgent)
			.mockReturnValueOnce(mockFallbackAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(
			mockModel,
			[mockTool],
			mockPrompt,
			options,
			undefined,
			undefined,
			mockFallbackModel,
		);

		expect(createToolCallingAgent).toHaveBeenCalledTimes(2);
		expect(createToolCallingAgent).toHaveBeenNthCalledWith(1, {
			llm: mockModel,
			tools: [mockTool],
			prompt: mockPrompt,
			streamRunnable: false,
		});
		expect(createToolCallingAgent).toHaveBeenNthCalledWith(2, {
			llm: mockFallbackModel,
			tools: [mockTool],
			prompt: mockPrompt,
			streamRunnable: false,
		});

		expect(mockAgent.withFallbacks).toHaveBeenCalledWith([mockFallbackAgent]);

		expect(RunnableSequence.from).toHaveBeenCalledWith([
			mockAgentWithFallback,
			mockStepsParser,
			commonHelpers.fixEmptyContentMessage,
		]);
	});

	it('should pass output parser to getAgentStepsParser', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockOutputParser = mock<any>();
		const mockStepsParser = vi.fn();

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(mockModel, [mockTool], mockPrompt, options, mockOutputParser);

		expect(commonHelpers.getAgentStepsParser).toHaveBeenCalledWith(mockOutputParser, undefined);
	});

	it('should pass memory to getAgentStepsParser', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockMemory = mock<any>();
		const mockStepsParser = vi.fn();

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(mockModel, [mockTool], mockPrompt, options, undefined, mockMemory);

		expect(commonHelpers.getAgentStepsParser).toHaveBeenCalledWith(undefined, mockMemory);
	});

	it('should set streamRunnable to false for agents', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockStepsParser = vi.fn();

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(mockModel, [mockTool], mockPrompt, options);

		expect(createToolCallingAgent).toHaveBeenCalledWith(
			expect.objectContaining({
				streamRunnable: false,
			}),
		);
	});

	it('should handle null fallback model', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockStepsParser = vi.fn();

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(mockModel, [mockTool], mockPrompt, options, undefined, undefined, null);

		// Should only create one agent (no fallback)
		expect(createToolCallingAgent).toHaveBeenCalledTimes(1);
		expect(RunnableSequence.from).toHaveBeenCalledWith([
			mockAgent,
			mockStepsParser,
			commonHelpers.fixEmptyContentMessage,
		]);
	});

	it('should create sequence with multiple tools', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockTool2 = mock<Tool>();
		const mockStepsParser = vi.fn();

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(mockModel, [mockTool, mockTool2], mockPrompt, options);

		expect(createToolCallingAgent).toHaveBeenCalledWith(
			expect.objectContaining({
				tools: [mockTool, mockTool2],
			}),
		);
	});

	it('should not bind tools when forceToolUse is false', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockStepsParser = vi.fn();
		const bindTools = vi.fn();
		const modelWithBind = mock<BaseChatModel>({ bindTools });

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(
			modelWithBind,
			[mockTool],
			mockPrompt,
			options,
			undefined,
			undefined,
			null,
			false,
		);

		expect(bindTools).not.toHaveBeenCalled();
		expect(createToolCallingAgent).toHaveBeenCalledWith(
			expect.objectContaining({ llm: modelWithBind }),
		);
	});

	it('should pre-bind tools with tool_choice "required" when forceToolUse is true', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockStepsParser = vi.fn();
		const boundRunnable = mock<any>();
		const bindTools = vi.fn().mockReturnValue(boundRunnable);
		const modelWithBind = mock<BaseChatModel>({ bindTools });

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(
			modelWithBind,
			[mockTool],
			mockPrompt,
			options,
			undefined,
			undefined,
			null,
			true,
		);

		expect(bindTools).toHaveBeenCalledWith([mockTool], { tool_choice: 'required' });
		expect(createToolCallingAgent).toHaveBeenCalledWith(
			expect.objectContaining({ llm: boundRunnable }),
		);
	});

	it('should fall back to the original model when bindTools is missing', () => {
		const mockAgent = mock<any>();
		const mockRunnableSequence = mock<any>();
		const mockStepsParser = vi.fn();
		// `bindTools` is optional on BaseChatModel — emulate a model that doesn't expose it.
		const modelWithoutBind = mock<BaseChatModel>();
		// vitest-mock-extended auto-mocks every prop; explicitly drop bindTools.
		(modelWithoutBind as unknown as { bindTools?: unknown }).bindTools = undefined;

		(createToolCallingAgent as Mock).mockReturnValue(mockAgent);
		(RunnableSequence.from as Mock).mockReturnValue(mockRunnableSequence);
		vi.spyOn(commonHelpers, 'getAgentStepsParser').mockReturnValue(mockStepsParser);

		const options = { maxIterations: 10, returnIntermediateSteps: false };
		createAgentSequence(
			modelWithoutBind,
			[mockTool],
			mockPrompt,
			options,
			undefined,
			undefined,
			null,
			true,
		);

		expect(createToolCallingAgent).toHaveBeenCalledWith(
			expect.objectContaining({ llm: modelWithoutBind }),
		);
	});
});
