import type { ComponentEntry, ComponentCategory } from "./types";
import { ApiRequestSchema } from "@/components/api/ApiRequest";
import { ApiResponseSchema } from "@/components/api/ApiResponse";
import { StatusCodeSchema } from "@/components/api/StatusCode";
import { ArchitectureDiagramSchema } from "@/components/architecture/ArchitectureDiagram";
import { DatabaseTableSchema } from "@/components/database/DatabaseTable";
import { TerminalSchema } from "@/components/devtools/Terminal";
import { JwtViewerSchema } from "@/components/auth/JwtViewer";
import { QueueVisualizerSchema } from "@/components/distributed/QueueVisualizer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEntry = ComponentEntry<any>;

export const registry: Record<string, AnyEntry> = {
  "api-request": {
    id: "api-request",
    name: "API Request",
    category: "api" as ComponentCategory,
    description: "HTTP request panel with method, URL, headers, body, and optional send interaction",
    schema: ApiRequestSchema,
    tags: ["http", "rest", "request", "api"],
    interactive: true,
    defaultProps: {
      method: "POST",
      url: "https://api.example.com/users",
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." },
      ],
      body: JSON.stringify({ name: "Alice", email: "alice@example.com", role: "admin" }, null, 2),
      description: "Create a new user account",
      interactive: true,
    },
    examples: [
      {
        label: "GET Request",
        props: {
          method: "GET",
          url: "https://api.example.com/users/42",
          headers: [{ key: "Authorization", value: "Bearer <token>" }],
          interactive: false,
        },
      },
      {
        label: "POST with body",
        props: {
          method: "POST",
          url: "https://api.example.com/users",
          headers: [{ key: "Content-Type", value: "application/json" }],
          body: JSON.stringify({ name: "Bob", email: "bob@example.com" }, null, 2),
          interactive: true,
        },
      },
      {
        label: "DELETE Request",
        props: {
          method: "DELETE",
          url: "https://api.example.com/users/42",
          headers: [{ key: "Authorization", value: "Bearer <token>" }],
          interactive: false,
        },
      },
    ],
    Component: null as unknown as AnyEntry["Component"],
  },

  "api-response": {
    id: "api-response",
    name: "API Response",
    category: "api" as ComponentCategory,
    description: "HTTP response panel with status code, headers, latency, and body",
    schema: ApiResponseSchema,
    tags: ["http", "rest", "response", "api"],
    defaultProps: {
      status: 201,
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "X-Request-Id", value: "req_a1b2c3d4" },
      ],
      body: JSON.stringify({ id: 42, name: "Alice", email: "alice@example.com", createdAt: "2026-01-01T00:00:00Z" }, null, 2),
      latency: 142,
    },
    examples: [
      {
        label: "404 Not Found",
        props: {
          status: 404,
          body: JSON.stringify({ error: "User not found", code: "USER_NOT_FOUND" }, null, 2),
          latency: 38,
        },
      },
      {
        label: "500 Server Error",
        props: {
          status: 500,
          body: JSON.stringify({ error: "Internal server error", requestId: "req_xyz" }, null, 2),
          latency: 2341,
        },
      },
      {
        label: "200 OK with data",
        props: {
          status: 200,
          body: JSON.stringify({ users: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }], total: 2 }, null, 2),
          latency: 56,
        },
      },
    ],
    Component: null as unknown as AnyEntry["Component"],
  },

  "status-code": {
    id: "status-code",
    name: "Status Code",
    category: "api" as ComponentCategory,
    description: "Color-coded HTTP status code badge with description",
    schema: StatusCodeSchema,
    tags: ["http", "status", "badge"],
    defaultProps: { code: 200, showText: true, size: "md" },
    examples: [
      { label: "201 Created", props: { code: 201, showText: true, size: "md" } },
      { label: "404 Not Found", props: { code: 404, showText: true, size: "md" } },
      { label: "500 Error", props: { code: 500, showText: true, size: "lg" } },
      { label: "429 Rate Limited", props: { code: 429, showText: true, size: "sm" } },
    ],
    Component: null as unknown as AnyEntry["Component"],
  },

  "architecture-diagram": {
    id: "architecture-diagram",
    name: "Architecture Diagram",
    category: "architecture" as ComponentCategory,
    description: "Visual system architecture with typed nodes and connections",
    schema: ArchitectureDiagramSchema,
    tags: ["architecture", "system", "diagram", "infrastructure"],
    interactive: true,
    defaultProps: {
      title: "E-commerce Platform",
      layout: "horizontal",
      nodes: [
        { id: "browser", type: "client", label: "Browser", sublabel: "React SPA", status: "active" },
        { id: "cdn", type: "cdn", label: "CloudFront", sublabel: "CDN", status: "active" },
        { id: "lb", type: "loadbalancer", label: "ALB", sublabel: "AWS ELB" },
        { id: "api", type: "gateway", label: "API Gateway", status: "active" },
        { id: "svc", type: "service", label: "Order Service", sublabel: "Node.js" },
        { id: "db", type: "database", label: "PostgreSQL", sublabel: "RDS", status: "active" },
        { id: "cache", type: "cache", label: "Redis", sublabel: "ElastiCache" },
      ],
      connections: [
        { from: "browser", to: "cdn", label: "HTTPS", direction: "forward", style: "solid" },
        { from: "cdn", to: "lb", direction: "forward", style: "solid" },
        { from: "lb", to: "api", direction: "forward", style: "solid" },
        { from: "api", to: "svc", direction: "forward", style: "solid" },
        { from: "svc", to: "db", label: "SQL", direction: "both", style: "solid" },
      ],
    },
    examples: [
      {
        label: "Microservices",
        props: {
          title: "Microservices Architecture",
          layout: "grid",
          nodes: [
            { id: "client", type: "client", label: "Mobile App" },
            { id: "gw", type: "gateway", label: "API Gateway" },
            { id: "auth", type: "service", label: "Auth Service" },
            { id: "user", type: "service", label: "User Service" },
            { id: "order", type: "service", label: "Order Service" },
            { id: "queue", type: "queue", label: "RabbitMQ" },
            { id: "worker", type: "worker", label: "Email Worker" },
            { id: "db1", type: "database", label: "Users DB" },
            { id: "db2", type: "database", label: "Orders DB" },
          ],
        },
      },
    ],
    Component: null as unknown as AnyEntry["Component"],
  },

  "database-table": {
    id: "database-table",
    name: "Database Table",
    category: "database" as ComponentCategory,
    description: "SQL table schema with columns, types, constraints, and sample rows",
    schema: DatabaseTableSchema,
    tags: ["database", "sql", "table", "schema"],
    interactive: true,
    defaultProps: {
      name: "users",
      schema: "public",
      columns: [
        { name: "id", type: "bigserial", nullable: false, primaryKey: true, unique: true },
        { name: "email", type: "varchar(255)", nullable: false, unique: true, index: true },
        { name: "name", type: "varchar(100)", nullable: false },
        { name: "role", type: "varchar(50)", nullable: false, default: "'user'" },
        { name: "email_verified", type: "boolean", nullable: false, default: "false" },
        { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
        { name: "updated_at", type: "timestamptz", nullable: true },
      ],
      showRows: true,
      rows: [
        { id: 1, email: "alice@example.com", name: "Alice", role: "admin", email_verified: true, created_at: "2026-01-01 00:00:00" },
        { id: 2, email: "bob@example.com", name: "Bob", role: "user", email_verified: false, created_at: "2026-01-15 10:30:00" },
        { id: 3, email: "carol@example.com", name: "Carol", role: "user", email_verified: true, created_at: "2026-02-01 09:00:00" },
      ],
    },
    examples: [
      {
        label: "Orders Table",
        props: {
          name: "orders",
          columns: [
            { name: "id", type: "uuid", nullable: false, primaryKey: true },
            { name: "user_id", type: "bigint", nullable: false, foreignKey: "users.id", index: true },
            { name: "status", type: "varchar(20)", nullable: false, default: "'pending'" },
            { name: "total", type: "decimal(10,2)", nullable: false },
            { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
          ],
          showRows: false,
        },
      },
    ],
    Component: null as unknown as AnyEntry["Component"],
  },

  "terminal": {
    id: "terminal",
    name: "Terminal",
    category: "devtools" as ComponentCategory,
    description: "Terminal panel with command/output lines, copy support, and optional interactive input",
    schema: TerminalSchema,
    tags: ["terminal", "cli", "shell", "command"],
    interactive: true,
    defaultProps: {
      title: "Deploy to production",
      shell: "bash",
      theme: "dark",
      interactive: false,
      lines: [
        { type: "comment", content: "Build and push Docker image" },
        { type: "command", content: "docker build -t myapp:latest ." },
        { type: "output", content: "[+] Building 12.4s (18/18) FINISHED" },
        { type: "output", content: " => exporting to image" },
        { type: "command", content: "docker push registry.example.com/myapp:latest" },
        { type: "output", content: "latest: digest: sha256:abc123 size: 1234" },
        { type: "comment", content: "Deploy to Kubernetes" },
        { type: "command", content: "kubectl set image deploy/myapp app=registry.example.com/myapp:latest" },
        { type: "output", content: 'deployment.apps/myapp image updated' },
        { type: "command", content: "kubectl rollout status deploy/myapp" },
        { type: "output", content: 'deployment "myapp" successfully rolled out' },
      ],
    },
    examples: [
      {
        label: "npm install",
        props: {
          shell: "bash",
          theme: "dark",
          lines: [
            { type: "command", content: "npm install" },
            { type: "output", content: "added 847 packages in 12s" },
            { type: "command", content: "npm run build" },
            { type: "output", content: "> myapp@1.0.0 build" },
            { type: "output", content: "> next build" },
            { type: "output", content: "✓ Compiled successfully" },
          ],
        },
      },
      {
        label: "Interactive",
        props: {
          shell: "bash",
          theme: "dark",
          interactive: true,
          lines: [
            { type: "output", content: "Welcome to the dev environment" },
            { type: "command", content: "ls -la" },
            { type: "output", content: "drwxr-xr-x  src/" },
            { type: "output", content: "drwxr-xr-x  node_modules/" },
            { type: "output", content: "-rw-r--r--  package.json" },
          ],
        },
      },
    ],
    Component: null as unknown as AnyEntry["Component"],
  },

  "jwt-viewer": {
    id: "jwt-viewer",
    name: "JWT Viewer",
    category: "auth" as ComponentCategory,
    description: "Decode and visualize JWT tokens — header, payload, and signature sections",
    schema: JwtViewerSchema,
    tags: ["jwt", "auth", "token", "security"],
    interactive: true,
    defaultProps: {
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        sub: "usr_1234567890",
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "admin",
        iat: 1516239022,
        exp: 1516242622,
      },
      showSignature: true,
    },
    examples: [
      {
        label: "RS256 (OAuth)",
        props: {
          header: { alg: "RS256", typ: "JWT", kid: "key-2026-01" },
          payload: {
            iss: "https://auth.example.com",
            sub: "usr_abc123",
            aud: "api.example.com",
            scope: "read:users write:orders",
            iat: 1516239022,
            exp: 1516242622,
          },
          showSignature: true,
        },
      },
    ],
    Component: null as unknown as AnyEntry["Component"],
  },

  "queue-visualizer": {
    id: "queue-visualizer",
    name: "Queue Visualizer",
    category: "distributed" as ComponentCategory,
    description: "Interactive message queue with produce/consume simulation and status tracking",
    schema: QueueVisualizerSchema,
    tags: ["queue", "distributed", "messaging", "async", "worker"],
    interactive: true,
    defaultProps: {
      name: "task-queue",
      type: "FIFO",
      producerLabel: "API Server",
      consumerLabel: "Worker",
      interactive: true,
      maxVisible: 6,
    },
    examples: [
      {
        label: "Email Queue",
        props: {
          name: "email-queue",
          type: "FIFO",
          producerLabel: "App Server",
          consumerLabel: "Email Worker",
          interactive: true,
        },
      },
    ],
    Component: null as unknown as AnyEntry["Component"],
  },
};

export const CATEGORIES: Record<ComponentCategory, { label: string; color: string }> = {
  api:          { label: "API",           color: "text-blue-600 dark:text-blue-400" },
  architecture: { label: "Architecture",  color: "text-emerald-600 dark:text-emerald-400" },
  database:     { label: "Database",      color: "text-violet-600 dark:text-violet-400" },
  auth:         { label: "Auth & Security", color: "text-amber-600 dark:text-amber-400" },
  networking:   { label: "Networking",    color: "text-cyan-600 dark:text-cyan-400" },
  cloud:        { label: "Cloud",         color: "text-sky-600 dark:text-sky-400" },
  containers:   { label: "Containers",    color: "text-orange-600 dark:text-orange-400" },
  distributed:  { label: "Distributed",   color: "text-rose-600 dark:text-rose-400" },
  code:         { label: "Code",          color: "text-zinc-600 dark:text-zinc-400" },
  devtools:     { label: "Dev Tools",     color: "text-indigo-600 dark:text-indigo-400" },
};

export function getByCategory(category: ComponentCategory) {
  return Object.values(registry).filter((e) => e.category === category);
}

export function search(query: string) {
  const q = query.toLowerCase();
  return Object.values(registry).filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags?.some((t) => t.includes(q))
  );
}
