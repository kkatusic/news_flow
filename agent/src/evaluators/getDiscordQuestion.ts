import {
    composeContext,
    Evaluator,
    generateObjectArray,
    generateText,
    IAgentRuntime,
    Memory,
    ModelClass,
} from "@elizaos/core";

const validationTemplate = `
TASK: Determine if the user's project has passed validation.

# EXAMPLES
{{evaluationExamples}}

# INSTRUCTIONS
- Extract the project name from the user's query.
- If the project is found in the validation records, return its status.
- If no record exists, return "UNKNOWN".
- Responses should follow the format:

\`\`\`json
{
  "project": "<extracted project name>",
  "status": "<PASSED | FAILED | UNKNOWN>"
}
\`\`\`

# USER QUERY
{{recentMessages}}
`;

// Evaluator Handler
async function handler(runtime: IAgentRuntime, message: Memory) {
    // const state = await runtime.composeState(message);
    // const context = composeContext({
    //     state,
    //     template: questionTemplate,
    // });
    // // Generate AI response using GPT model
    // const extracted = await generateObjectArray({
    //     runtime,
    //     context,
    //     modelClass: ModelClass.LARGE,
    // });
    // if (!extracted || extracted.length === 0) {
    //     return [];
    // }
    // return extracted.map((q) => q.question);

    console.log("*** EVALUATING STUFF!!!!!!! ***");

    const contextName = `Excrating the project name from the {{username}} message. The message is: ${message.content.text}.
    Only respond with the search term, do not include any other text.`;

    const projectName = await generateText({
        runtime,
        context: contextName,
        modelClass: ModelClass.SMALL, // Because we don't want touse big model for small text generation
        stop: ["\n"],
    });

    console.log("*** PROJECT NAME: ", projectName);

    const state = await runtime.composeState(message);
    const { agentId } = state;

    const context = composeContext({
        state,
        template:
            runtime.character.templates?.evaluationTemplate ||
            validationTemplate,
    });

    // const projectValidation = await generateObjectArray({
    //     runtime,
    //     context,
    //     modelClass: ModelClass.LARGE,
    // });

    // if (!projectValidation || projectValidation.length === 0) {
    //     return "I couldn't find any validation record for this project.";
    // }

    return `Project **${projectName}** validation status: we need to ask reviewer.`;
}

// Define the Evaluator
export const questionEvaluator: Evaluator = {
    name: "EXTRACT_QUESTION",
    similes: ["QUESTION_DETECTION", "QUESTION_EXTRACTION"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // return message.content.text.endsWith("?"); // Only trigger on questions
        console.log("*** VALIDATING STUFF!!!!!!! ***");
        return true;
    },
    description: "Extract the last question asked by a user in chat.",
    handler,
    examples: [
        {
            context: `Existing project records:
- Project: AI News Aggregator, Status: PASSED
- Project: Crypto Tracker, Status: FAILED`,

            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Did my project AI News Aggregator pass validation?",
                    },
                },
            ],
            outcome: `{
"project": "AI News Aggregator",
"status": "PASSED"
}`,
        },
        {
            context: `Existing project records:
- Project: Web3 Analytics, Status: FAILED`,

            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Did my project Web3 Analytics pass validation?",
                    },
                },
            ],
            outcome: `{
"project": "Web3 Analytics",
"status": "FAILED"
}`,
        },
        {
            context: `Existing project records:
- Project: AI Trading Bot, Status: PASSED`,

            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "Did my project Blockchain Monitor pass validation?",
                    },
                },
            ],
            outcome: `{
"project": "Blockchain Monitor",
"status": "UNKNOWN"
}`,
        },
    ],
};
