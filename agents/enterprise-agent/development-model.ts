import type {
  AgentModel,
  AgentModelDecision,
  AgentModelInput,
  AgentToolObservation
} from "./contracts.js";
import type { InstallPlanV010, PackageManifestV010, PlatformSnapshotV010 } from "../../contracts/package.js";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

function latest<T>(input: AgentModelInput, tool: string): AgentToolObservation | undefined {
  return [...input.observations].reverse().find(x => x.tool === tool);
}

function selectPackage(message: string, catalog: PackageManifestV010[]): PackageManifestV010 | undefined {
  const n = normalize(message);
  return catalog.find(pkg => {
    const id = normalize(pkg.packageId);
    const name = normalize(pkg.displayName);
    return n.includes(id) || n.includes(name);
  }) ?? (
    /笔记/.test(message)
      ? catalog.find(pkg => pkg.packageId === "company-notes")
      : undefined
  );
}

/**
 * Offline development model.
 *
 * It exists only to verify the Agent → Tool → App Manager loop without
 * binding Personal Agent to any LLM provider. Production should replace
 * this through the AgentModel port.
 */
export function createDevelopmentAgentModel(): AgentModel {
  return {
    async decide(input: AgentModelInput): Promise<AgentModelDecision> {
      const failed = input.observations.find(x => !x.ok);
      if (failed) {
        return {
          type: "final",
          message: `操作失败：${failed.error?.message ?? "未知错误"}`
        };
      }

      const installed = latest(input, "app.install.execute");
      if (installed?.ok) {
        const snapshot = installed.result as PlatformSnapshotV010;
        const names = snapshot.installedPackages.map(x => x.packageId).join(", ");
        return {
          type: "final",
          message: `安装完成。当前已安装 Package：${names || "无"}。`
        };
      }

      const planned = latest(input, "app.install.plan");
      if (planned?.ok) {
        const plan = planned.result as InstallPlanV010;
        if (plan.blockers.length > 0) {
          return {
            type: "final",
            message: `无法安装：${plan.blockers.map(x => x.message).join("；")}`
          };
        }
        return {
          type: "tool",
          call: {
            tool: "app.install.execute",
            arguments: { packageId: plan.packageId }
          }
        };
      }

      const catalogObservation = latest(input, "app.catalog.list");
      if (catalogObservation?.ok) {
        const catalog = catalogObservation.result as PackageManifestV010[];
        const target = selectPackage(input.userMessage, catalog);
        if (!target) {
          return {
            type: "final",
            message: `我找到了这些可安装应用：${catalog.map(x => x.displayName).join("、")}。请告诉我要安装哪一个。`
          };
        }
        return {
          type: "tool",
          call: {
            tool: "app.install.plan",
            arguments: { packageId: target.packageId }
          }
        };
      }

      return {
        type: "tool",
        call: { tool: "app.catalog.list", arguments: {} }
      };
    }
  };
}
