import { Plugin } from "@elizaos/core";
import { getNewsAction } from "./actions/getNews.ts";
import { TwitterNewsProvider } from "./providers/twitterNewsProvider.ts";

// import { getCurrentNewsAction } from "./actions/currentNews.ts";
// import { factEvaluator } from "./evaluators/fact.ts";
// import { randomEmotionProvider } from "./providers/time.ts";

// export * as actions from "./actions";
// export * as evaluators from "./evaluators";
// export * as providers from "./providers";

export const newsFlowAIPlugin: Plugin = {
    name: "newflowaiplugin",
    description: "News Flow AI agent plugin",
    actions: [getNewsAction],
    providers: [TwitterNewsProvider],
};
