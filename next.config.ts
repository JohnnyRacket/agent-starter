import { withVercelToolbar } from "@vercel/toolbar/plugins/next";
import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bash-tool", "@vercel/sandbox", "ajv"],
};

export default withWorkflow(withVercelToolbar()(nextConfig));
