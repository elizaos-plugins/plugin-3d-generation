// src/index.ts
import { elizaLogger } from "@elizaos/core";
import { fal } from "@fal-ai/client";

// src/constants.ts
var FAL_CONSTANTS = {
  API_3D_ENDPOINT: "fal-ai/hyper3d/rodin",
  API_KEY_SETTING: "FAL_API_KEY"
  // The setting name to fetch from runtime
};

// src/index.ts
import * as fs from "fs";
import { Buffer } from "buffer";
import * as path from "path";
import * as process from "process";
var generate3D = async (prompt, runtime) => {
  process.env["FAL_KEY"] = FAL_CONSTANTS.API_KEY_SETTING || runtime.getSetting("FAL_API_KEY");
  try {
    elizaLogger.log("Starting 3D generation with prompt:", prompt);
    const response = await fal.subscribe(FAL_CONSTANTS.API_3D_ENDPOINT, {
      input: {
        prompt,
        input_image_urls: [],
        condition_mode: "concat",
        // fuse concat
        geometry_file_format: "glb",
        // glb usdz fbx obj stl
        material: "PBR",
        // PBR Shaded
        quality: "medium",
        // extra-low, low, medium, high
        tier: "Regular"
        // Regular, Sketch
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(elizaLogger.log);
        }
      }
    });
    elizaLogger.log(
      "Generation request successful, received response:",
      response
    );
    return {
      success: true,
      url: response.data.model_mesh.url,
      file_name: response.data.model_mesh.file_name
    };
  } catch (error) {
    elizaLogger.error("3D generation error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
};
var ThreeDGeneration = {
  name: "GENERATE_3D",
  similes: [
    "3D_GENERATION",
    "3D_GEN",
    "CREATE_3D",
    "MAKE_3D",
    "TEXT23D",
    "TEXT_TO_3D",
    "3D_CREATE",
    "3D_MAKE"
  ],
  description: "Generate a 3D object based on a text prompt",
  validate: async (runtime, _message) => {
    elizaLogger.log("Validating 3D generation action");
    const FalApiKey = runtime.getSetting("FAL_API_KEY");
    elizaLogger.log("FAL_API_KEY present:", !!FalApiKey);
    return !!FalApiKey;
  },
  handler: async (runtime, message, _state, _options, callback) => {
    elizaLogger.log("3D generation request:", message);
    const ThreeDPrompt = message.content.text.replace(/<@\d+>/g, "").replace(/generate 3D|create 3D|make 3D|render 3D/gi, "").trim();
    if (!ThreeDPrompt || ThreeDPrompt.length < 3) {
      callback({
        text: "Could you please provide more details about what kind of 3D object you'd like me to generate? For example: 'Generate a lovely cat'"
      });
      return;
    }
    elizaLogger.log("3D prompt:", ThreeDPrompt);
    callback({
      text: `I'll generate a 3D object based on your prompt: "${ThreeDPrompt}". This might take a few minutes...`
    });
    try {
      const result = await generate3D(ThreeDPrompt, runtime);
      if (result.success && result.url && result.file_name) {
        const response = await fetch(result.url);
        const arrayBuffer = await response.arrayBuffer();
        const ThreeDFileName = `content_cache/generated_3d_${result.file_name}`;
        const directoryPath = path.dirname(ThreeDFileName);
        if (!fs.existsSync(directoryPath)) {
          fs.mkdirSync(directoryPath, { recursive: true });
        }
        fs.writeFileSync(ThreeDFileName, Buffer.from(arrayBuffer));
        callback(
          {
            text: "Here's your generated 3D object!",
            attachments: [
              {
                id: crypto.randomUUID(),
                url: result.url,
                title: "Generated 3D",
                source: "ThreeDGeneration",
                description: ThreeDPrompt,
                text: ThreeDPrompt
              }
            ]
          },
          [ThreeDFileName]
        );
      } else {
        callback({
          text: `3D generation failed: ${result.error}`,
          error: true
        });
      }
    } catch (error) {
      elizaLogger.error(`Failed to generate 3D. Error: ${error}`);
      callback({
        text: `3D generation failed: ${error.message}`,
        error: true
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Generate a 3D object of a cat playing piano"
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll create a 3D object of a cat playing piano for you",
          action: "GENERATE_3D"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you make a 3D object of a anime character Goku?"
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll generate a 3D object of a anime character Goku for you",
          action: "GENERATE_3D"
        }
      }
    ]
  ]
};
var ThreeDGenerationPlugin = {
  name: "3DGeneration",
  description: "Generate 3D using Hyper 3D",
  actions: [ThreeDGeneration],
  evaluators: [],
  providers: []
};
export {
  ThreeDGenerationPlugin
};
//# sourceMappingURL=index.js.map