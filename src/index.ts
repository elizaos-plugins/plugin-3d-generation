import { ThreeDGeneration } from "./actions/3d-generation"; 


export const ThreeDGenerationPlugin = {
    name: "3DGeneration",
    description: "Generate 3D using Hyper 3D",
    actions: [ThreeDGeneration as any],
    evaluators: [],
    providers: [],
};
