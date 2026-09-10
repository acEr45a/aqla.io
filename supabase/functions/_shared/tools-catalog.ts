// @ts-nocheck
// supabase/functions/_shared/tools-catalog.ts
// Function declarations & schema definitions for AQLA Agent Tool Calling

export interface ToolDefinition {
  name: string;
  description: string;
  isMutating?: boolean;
  parameters: {
    type: "OBJECT";
    properties: Record<
      string,
      {
        type: "STRING" | "NUMBER" | "BOOLEAN" | "ARRAY" | "OBJECT";
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

export const TOOLS_CATALOG: Record<string, ToolDefinition> = {
  search_knowledge_base: {
    name: "search_knowledge_base",
    description:
      "Perform semantic vector RAG search against the AQLA verified knowledge base. Retrieves authoritative platform FAQs, evidence-graded cognitive protocols, and system architecture documentation.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "The search query or concept to look up.",
        },
        category: {
          type: "STRING",
          description:
            "Optional filter category: 'platform_faq', 'cognitive_protocols', or 'architecture_tech'.",
          enum: ["platform_faq", "cognitive_protocols", "architecture_tech"],
        },
        limit: {
          type: "NUMBER",
          description: "Number of relevant documents to retrieve (1-5, default 3).",
        },
      },
      required: ["query"],
    },
  },

  get_system_health: {
    name: "get_system_health",
    description:
      "Retrieve real-time database and service telemetry: table record counts, active AI runs, error frequencies, and service health.",
    parameters: {
      type: "OBJECT",
      properties: {
        include_table_counts: {
          type: "BOOLEAN",
          description: "Whether to return live row counts for primary tables.",
        },
      },
    },
  },

  inspect_user_flow: {
    name: "inspect_user_flow",
    description:
      "Analyze member onboarding progression, drop-off points, and missing daily check-ins.",
    parameters: {
      type: "OBJECT",
      properties: {
        flow_type: {
          type: "STRING",
          description: "Type of flow: 'onboarding' or 'checkin_streak'.",
          enum: ["onboarding", "checkin_streak"],
        },
        limit: {
          type: "NUMBER",
          description: "Maximum number of records to return.",
        },
      },
      required: ["flow_type"],
    },
  },

  get_email_delivery_status: {
    name: "get_email_delivery_status",
    description:
      "Query email delivery events, bounce rates, and recent dispatch logs.",
    parameters: {
      type: "OBJECT",
      properties: {
        recipient_email: {
          type: "STRING",
          description: "Optional email address to filter logs.",
        },
        status: {
          type: "STRING",
          description: "Filter by status: 'delivered', 'failed', 'bounced', or 'all'.",
          enum: ["delivered", "failed", "bounced", "all"],
        },
      },
    },
  },

  retrigger_email: {
    name: "retrigger_email",
    description:
      "Re-send a transactional or digest email to a specified recipient. MUTATING ACTION - requires confirmation.",
    isMutating: true,
    parameters: {
      type: "OBJECT",
      properties: {
        recipient_email: {
          type: "STRING",
          description: "Recipient email address.",
        },
        template_id: {
          type: "STRING",
          description: "Email template identifier (e.g. 'weekly_digest', 'welcome_onboarding').",
        },
        reason: {
          type: "STRING",
          description: "Reason for retriggering the email.",
        },
      },
      required: ["recipient_email", "template_id"],
    },
  },

  reset_onboarding_step: {
    name: "reset_onboarding_step",
    description:
      "Reset a user's onboarding state to unblock them. MUTATING ACTION - requires confirmation.",
    isMutating: true,
    parameters: {
      type: "OBJECT",
      properties: {
        user_id: {
          type: "STRING",
          description: "User UUID to reset.",
        },
        target_step: {
          type: "STRING",
          description: "Step to set (e.g. 'initial_assessment', 'profile_setup', 'ready').",
        },
      },
      required: ["user_id", "target_step"],
    },
  },

  inspect_db_schema: {
    name: "inspect_db_schema",
    description:
      "Inspect live PostgreSQL schema: table structures, column datatypes, primary/foreign keys, indexes, and Row Level Security (RLS) policies.",
    parameters: {
      type: "OBJECT",
      properties: {
        table_name: {
          type: "STRING",
          description: "Optional specific table name to inspect (e.g. 'ai_runs', 'profiles'). If omitted, lists all public tables.",
        },
      },
    },
  },

  search_codebase: {
    name: "search_codebase",
    description:
      "Search the repository architecture registry, component catalog, and Edge Function manifests for technical reference.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "Search keyword or symbol (e.g. 'apiClient', 'worker-registry', 'RLS').",
        },
      },
      required: ["query"],
    },
  },

  get_member_status: {
    name: "get_member_status",
    description:
      "Retrieve the requesting member's current status: active tier, onboarding completion, completed cognitive tests, and active protocols.",
    parameters: {
      type: "OBJECT",
      properties: {
        member_id: {
          type: "STRING",
          description: "User UUID (defaults to the calling user).",
        },
      },
    },
  },

  get_member_brain_metrics: {
    name: "get_member_brain_metrics",
    description:
      "Retrieve the member's current cognitive domain scores (Working Memory, Speed, Attention, Flexibility, Stress Resilience) and recent baseline trends.",
    parameters: {
      type: "OBJECT",
      properties: {
        member_id: {
          type: "STRING",
          description: "User UUID (defaults to the calling user).",
        },
      },
    },
  },

  create_support_ticket: {
    name: "create_support_ticket",
    description:
      "Escalate a member question or technical issue to the AQLA support and clinical review team.",
    parameters: {
      type: "OBJECT",
      properties: {
        subject: {
          type: "STRING",
          description: "Summary subject of the issue.",
        },
        details: {
          type: "STRING",
          description: "Detailed description of the issue or feedback.",
        },
        category: {
          type: "STRING",
          description: "Category: 'technical', 'clinical', 'billing', or 'feedback'.",
          enum: ["technical", "clinical", "billing", "feedback"],
        },
      },
      required: ["subject", "details"],
    },
  },
};

// Agent-to-Tool Mappings
export const AGENT_TOOLS: Record<string, string[]> = {
  backend_ops_operations: [
    "search_knowledge_base",
    "get_system_health",
    "inspect_user_flow",
    "get_email_delivery_status",
    "retrigger_email",
    "reset_onboarding_step",
  ],
  backend_ops_architect: [
    "search_knowledge_base",
    "inspect_db_schema",
    "search_codebase",
    "get_system_health",
  ],
  help_agent: [
    "search_knowledge_base",
    "get_member_status",
    "create_support_ticket",
  ],
  aqla_intelligence: [
    "search_knowledge_base",
    "get_member_status",
    "get_member_brain_metrics",
  ],
};

export function getToolsForAgent(agentKey: string): ToolDefinition[] {
  const toolNames = AGENT_TOOLS[agentKey] || AGENT_TOOLS.help_agent;
  return toolNames.map((name) => TOOLS_CATALOG[name]).filter(Boolean);
}
