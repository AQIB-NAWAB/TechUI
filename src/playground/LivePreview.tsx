"use client";

import { cn } from "@/lib/utils";
import { ApiRequest } from "@/components/api/ApiRequest";
import { ApiResponse } from "@/components/api/ApiResponse";
import { StatusCode } from "@/components/api/StatusCode";
import { HttpEndpoint } from "@/components/api/HttpEndpoint";
import { ArchitectureDiagram } from "@/components/architecture/ArchitectureDiagram";
import { SequenceDiagram } from "@/components/architecture/SequenceDiagram";
import { DatabaseTable } from "@/components/database/DatabaseTable";
import { Terminal } from "@/components/devtools/Terminal";
import { JwtViewer } from "@/components/auth/JwtViewer";
import { QueueVisualizer } from "@/components/distributed/QueueVisualizer";
import { KafkaTopic } from "@/components/distributed/KafkaTopic";
import { SqlQuery } from "@/components/database/SqlQuery";
import { CodeBlock } from "@/components/code/CodeBlock";
import { EnvVars } from "@/components/devtools/EnvVars";
import { CacheVisualizer } from "@/components/distributed/CacheVisualizer";
import { LogViewer } from "@/components/devtools/LogViewer";
import { DnsLookup } from "@/components/networking/DnsLookup";
import { TlsHandshake } from "@/components/networking/TlsHandshake";
import { CircuitBreaker } from "@/components/distributed/CircuitBreaker";
import { DockerContainer } from "@/components/containers/DockerContainer";
import { GitDiff } from "@/components/devtools/GitDiff";
import { CiPipeline } from "@/components/devtools/CiPipeline";
import { MetricsChart } from "@/components/devtools/MetricsChart";
import { KubernetesPod } from "@/components/containers/KubernetesPod";
import { LoadBalancer } from "@/components/architecture/LoadBalancer";
import { StackTrace } from "@/components/devtools/StackTrace";
import { WebhookEvent } from "@/components/api/WebhookEvent";
import { CloudFunction } from "@/components/cloud/CloudFunction";
import { RetryPolicy } from "@/components/distributed/RetryPolicy";
import { ComparisonTable } from "@/components/ui/ComparisonTable";
import { ServerStatus } from "@/components/cloud/ServerStatus";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Timeline } from "@/components/ui/Timeline";
import { RateLimiter } from "@/components/api/RateLimiter";
import { RegexTester } from "@/components/code/RegexTester";
import { FileTree } from "@/components/code/FileTree";
import { ColorPalette } from "@/components/ui/ColorPalette";
import { HttpHeaders } from "@/components/networking/HttpHeaders";
import { ApiKey } from "@/components/auth/ApiKey";
import { OAuthFlow } from "@/components/auth/OAuthFlow";
import { RequestLifecycle } from "@/components/networking/RequestLifecycle";
import { GraphQLQuery } from "@/components/api/GraphQLQuery";
import { ERDiagram } from "@/components/database/ERDiagram";
import { WebSocketConnection } from "@/components/api/WebSocketConnection";
import { KubernetesDeployment } from "@/components/containers/KubernetesDeployment";
import { ApiGateway } from "@/components/api/ApiGateway";
import { DataPipeline } from "@/components/distributed/DataPipeline";
import { EventBus } from "@/components/distributed/EventBus";
import { PaginationPattern } from "@/components/api/PaginationPattern";
import { ModelCard } from "@/components/ai/ModelCard";
import { PromptTemplate } from "@/components/ai/PromptTemplate";
import { TokenCounter } from "@/components/ai/TokenCounter";
import { ServiceMesh } from "@/components/distributed/ServiceMesh";
import { BigWordAlert } from "@/components/edu/BigWordAlert";
import { RealWorldEvent } from "@/components/edu/RealWorldEvent";
import { ConceptComparison } from "@/components/edu/ConceptComparison";
import { CodeDiff } from "@/components/edu/CodeDiff";
import { TechDecision } from "@/components/edu/TechDecision";
import { RequestFlow } from "@/components/edu/RequestFlow";
import { NPlusOne } from "@/components/edu/NPlusOne";
import { DatabaseIndex } from "@/components/database/DatabaseIndex";
import { ConnectionPool } from "@/components/database/ConnectionPool";
import { CdnEdge } from "@/components/cloud/CdnEdge";
import { CorsPolicy } from "@/components/api/CorsPolicy";
import { JwtFlow } from "@/components/auth/JwtFlow";
import { AbTest } from "@/components/ui/AbTest";
import { FeatureFlag } from "@/components/devtools/FeatureFlag";
import { HealthCheck } from "@/components/devtools/HealthCheck";
import { DeploymentStrategy } from "@/components/cloud/DeploymentStrategy";
import { DatabaseSharding } from "@/components/database/DatabaseSharding";
import { HttpCache } from "@/components/networking/HttpCache";
import { ErrorBoundary } from "@/components/code/ErrorBoundary";
import { RateLimitAlgorithms } from "@/components/api/RateLimitAlgorithms";
import { JwtClaims } from "@/components/auth/JwtClaims";
import { TcpHandshake } from "@/components/networking/TcpHandshake";
import { SqlJoins } from "@/components/database/SqlJoins";
import { CacheStrategies } from "@/components/distributed/CacheStrategies";
import { MicroserviceBoundaries } from "@/components/architecture/MicroserviceBoundaries";
import { GrpcVsRest } from "@/components/api/GrpcVsRest";
import { MemoryLeak } from "@/components/devtools/MemoryLeak";
import { LoadTesting } from "@/components/devtools/LoadTesting";
import { ApiVersioning } from "@/components/api/ApiVersioning";
import { MessageQueuePatterns } from "@/components/distributed/MessageQueuePatterns";
import { PasswordHashing } from "@/components/auth/PasswordHashing";
import { EnvironmentConfig } from "@/components/devtools/EnvironmentConfig";
import { OpenApiSpec } from "@/components/api/OpenApiSpec";
import { CircuitBreakerStates } from "@/components/distributed/CircuitBreakerStates";
import { GraphQLSchema } from "@/components/api/GraphQLSchema";
import { NetworkLatency } from "@/components/networking/NetworkLatency";
import { EventSourcing } from "@/components/distributed/EventSourcing";
import { WebhookSecurity } from "@/components/api/WebhookSecurity";
import { TwoFactorAuth } from "@/components/auth/TwoFactorAuth";
import { IndexTypes } from "@/components/database/IndexTypes";
import { ContainerNetworking } from "@/components/containers/ContainerNetworking";
import { DatabaseTransactions } from "@/components/database/DatabaseTransactions";
import { ServiceDiscovery } from "@/components/distributed/ServiceDiscovery";
import { DistributedTracing } from "@/components/devtools/DistributedTracing";
import { KubernetesHpa } from "@/components/containers/KubernetesHpa";
import { AsyncAwait } from "@/components/code/AsyncAwait";
import { OAuthScopes } from "@/components/auth/OAuthScopes";
import { CspHeaders } from "@/components/networking/CspHeaders";
import { SshTunnel } from "@/components/networking/SshTunnel";
import { WebSocketLifecycle } from "@/components/api/WebSocketLifecycle";
import { QueryOptimizer } from "@/components/database/QueryOptimizer";
import { DockerCompose } from "@/components/containers/DockerCompose";
import { LruCache } from "@/components/distributed/LruCache";
import { AiRag } from "@/components/ai/AiRag";
import { CqrsPattern } from "@/components/architecture/CqrsPattern";
import { SagaPattern } from "@/components/distributed/SagaPattern";
import { BigONotation } from "@/components/edu/BigONotation";
import { BlobStorage } from "@/components/cloud/BlobStorage";
import { SkeletonLoading } from "@/components/ui/SkeletonLoading";
import { BinarySearch } from "@/components/edu/BinarySearch";
import { DependencyInjection } from "@/components/architecture/DependencyInjection";
import { Compression } from "@/components/networking/Compression";
import { AiEmbeddings } from "@/components/ai/AiEmbeddings";
import { VirtualDom } from "@/components/ui/VirtualDom";
import { ConsistentHashing } from "@/components/distributed/ConsistentHashing";
import { BloomFilter } from "@/components/distributed/BloomFilter";
import { ApiCaching } from "@/components/api/ApiCaching";
import { Recursion } from "@/components/edu/Recursion";
import { MutexSemaphore } from "@/components/distributed/MutexSemaphore";
import { MultiRegion } from "@/components/cloud/MultiRegion";
import { JwtRefresh } from "@/components/auth/JwtRefresh";
import { Memoization } from "@/components/edu/Memoization";
import { Backpressure } from "@/components/distributed/Backpressure";
import { PollingVsWebhooks } from "@/components/api/PollingVsWebhooks";
import { Immutability } from "@/components/edu/Immutability";
import { ActorModel } from "@/components/distributed/ActorModel";
import { DatabaseNormalization } from "@/components/database/DatabaseNormalization";
import { PromiseCombinators } from "@/components/code/PromiseCombinators";
import { ProxyReverseProxy } from "@/components/networking/ProxyReverseProxy";
import { Serverless } from "@/components/cloud/Serverless";
import { HeapDataStructure } from "@/components/edu/HeapDataStructure";
import { DeadLetterQueue } from "@/components/distributed/DeadLetterQueue";
import { DnsPropagation } from "@/components/networking/DnsPropagation";
import { ReactiveStreams } from "@/components/distributed/ReactiveStreams";
import { ServiceWorker } from "@/components/networking/ServiceWorker";
import { KubernetesIngress } from "@/components/containers/KubernetesIngress";
import { CursorPagination } from "@/components/api/CursorPagination";
import { TreeShaking } from "@/components/code/TreeShaking";
import { DarkMode } from "@/components/ui/DarkMode";
import { SolidPrinciples } from "@/components/edu/SolidPrinciples";
import { SloSliSla } from "@/components/devtools/SloSliSla";
import { Http3Quic } from "@/components/networking/Http3Quic";
import { DesignPatterns } from "@/components/architecture/DesignPatterns";
import { DataReplication } from "@/components/distributed/DataReplication";
import { FeatureRollout } from "@/components/devtools/FeatureRollout";
import { IdempotencyKey } from "@/components/api/IdempotencyKey";
import { IdempotencyConsumer } from "@/components/distributed/IdempotencyConsumer";
import { StackVsQueue } from "@/components/edu/StackVsQueue";
import { SessionVsJwt } from "@/components/auth/SessionVsJwt";
import { GracefulShutdown } from "@/components/devtools/GracefulShutdown";
import { HashTableCollision } from "@/components/edu/HashTableCollision";
import { LeaderElection } from "@/components/distributed/LeaderElection";
import { ContextWindowOverflow } from "@/components/ai/ContextWindowOverflow";
import { HmacSigning } from "@/components/api/HmacSigning";
import { RateLimitHeaders } from "@/components/api/RateLimitHeaders";
import { TwoPhaseCommit } from "@/components/distributed/TwoPhaseCommit";
import { GraphTraversalBfsDfs } from "@/components/edu/GraphTraversalBfsDfs";
import { ReadRepair } from "@/components/distributed/ReadRepair";
import { AcidVsBase } from "@/components/database/AcidVsBase";
import { WebSocketVsSse } from "@/components/networking/WebSocketVsSse";
import { PriorityQueue } from "@/components/edu/PriorityQueue";
import { ContentNegotiation } from "@/components/api/ContentNegotiation";
import { PromptInjectionGuard } from "@/components/ai/PromptInjectionGuard";
import { CapTheorem } from "@/components/distributed/CapTheorem";
import { TriePrefixTree } from "@/components/edu/TriePrefixTree";
import { WalWriteAheadLog } from "@/components/database/WalWriteAheadLog";
import { GossipProtocol } from "@/components/distributed/GossipProtocol";
import { ConditionalRequestsEtag } from "@/components/api/ConditionalRequestsEtag";
import { TcpVsUdp } from "@/components/networking/TcpVsUdp";
import { UnionFindDisjointSet } from "@/components/edu/UnionFindDisjointSet";
import { RetryAfterHeader } from "@/components/api/RetryAfterHeader";
import { ToolCallingFlow } from "@/components/ai/ToolCallingFlow";
import { IsolationLevels } from "@/components/database/IsolationLevels";
import { VectorClock } from "@/components/distributed/VectorClock";
import { RagChunking } from "@/components/ai/RagChunking";
import { RaftConsensus } from "@/components/distributed/RaftConsensus";
import { OAuth2PkceFlow } from "@/components/api/OAuth2PkceFlow";
import { DeadlockDetection } from "@/components/database/DeadlockDetection";
import { MtlsHandshake } from "@/components/networking/MtlsHandshake";
import { RedBlackTree } from "@/components/edu/RedBlackTree";
import { EmbeddingSimilarity } from "@/components/ai/EmbeddingSimilarity";
import { WebhookReplay } from "@/components/api/WebhookReplay";
import { ConsistentReads } from "@/components/distributed/ConsistentReads";
import { IcmpPingTraceroute } from "@/components/networking/IcmpPingTraceroute";

const COMPONENT_MAP: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "api-request":          ApiRequest as React.ComponentType<Record<string, unknown>>,
  "api-response":         ApiResponse as React.ComponentType<Record<string, unknown>>,
  "status-code":          StatusCode as React.ComponentType<Record<string, unknown>>,
  "http-endpoint":        HttpEndpoint as React.ComponentType<Record<string, unknown>>,
  "architecture-diagram": ArchitectureDiagram as React.ComponentType<Record<string, unknown>>,
  "sequence-diagram":     SequenceDiagram as React.ComponentType<Record<string, unknown>>,
  "database-table":       DatabaseTable as React.ComponentType<Record<string, unknown>>,
  "terminal":             Terminal as React.ComponentType<Record<string, unknown>>,
  "jwt-viewer":           JwtViewer as React.ComponentType<Record<string, unknown>>,
  "queue-visualizer":     QueueVisualizer as React.ComponentType<Record<string, unknown>>,
  "kafka-topic":          KafkaTopic as React.ComponentType<Record<string, unknown>>,
  "sql-query":            SqlQuery as React.ComponentType<Record<string, unknown>>,
  "code-block":           CodeBlock as React.ComponentType<Record<string, unknown>>,
  "env-vars":             EnvVars as React.ComponentType<Record<string, unknown>>,
  "cache-visualizer":     CacheVisualizer as React.ComponentType<Record<string, unknown>>,
  "log-viewer":           LogViewer as React.ComponentType<Record<string, unknown>>,
  "dns-lookup":           DnsLookup as React.ComponentType<Record<string, unknown>>,
  "tls-handshake":        TlsHandshake as React.ComponentType<Record<string, unknown>>,
  "circuit-breaker":      CircuitBreaker as React.ComponentType<Record<string, unknown>>,
  "docker-container":     DockerContainer as React.ComponentType<Record<string, unknown>>,
  "git-diff":             GitDiff as React.ComponentType<Record<string, unknown>>,
  "ci-pipeline":          CiPipeline as React.ComponentType<Record<string, unknown>>,
  "metrics-chart":        MetricsChart as React.ComponentType<Record<string, unknown>>,
  "kubernetes-pod":       KubernetesPod as React.ComponentType<Record<string, unknown>>,
  "load-balancer":        LoadBalancer as React.ComponentType<Record<string, unknown>>,
  "stack-trace":          StackTrace as React.ComponentType<Record<string, unknown>>,
  "webhook-event":        WebhookEvent as React.ComponentType<Record<string, unknown>>,
  "cloud-function":       CloudFunction as React.ComponentType<Record<string, unknown>>,
  "retry-policy":         RetryPolicy as React.ComponentType<Record<string, unknown>>,
  "comparison-table":     ComparisonTable as React.ComponentType<Record<string, unknown>>,
  "server-status":        ServerStatus as React.ComponentType<Record<string, unknown>>,
  "password-strength":    PasswordStrength as React.ComponentType<Record<string, unknown>>,
  "timeline":             Timeline as React.ComponentType<Record<string, unknown>>,
  "rate-limiter":         RateLimiter as React.ComponentType<Record<string, unknown>>,
  "regex-tester":         RegexTester as React.ComponentType<Record<string, unknown>>,
  "file-tree":            FileTree as React.ComponentType<Record<string, unknown>>,
  "color-palette":        ColorPalette as React.ComponentType<Record<string, unknown>>,
  "http-headers":         HttpHeaders as React.ComponentType<Record<string, unknown>>,
  "api-key":              ApiKey as React.ComponentType<Record<string, unknown>>,
  "oauth-flow":           OAuthFlow as React.ComponentType<Record<string, unknown>>,
  "request-lifecycle":    RequestLifecycle as React.ComponentType<Record<string, unknown>>,
  "graphql-query":        GraphQLQuery as React.ComponentType<Record<string, unknown>>,
  "er-diagram":           ERDiagram as React.ComponentType<Record<string, unknown>>,
  "websocket-connection":    WebSocketConnection as React.ComponentType<Record<string, unknown>>,
  "kubernetes-deployment":   KubernetesDeployment as React.ComponentType<Record<string, unknown>>,
  "api-gateway":             ApiGateway as React.ComponentType<Record<string, unknown>>,
  "data-pipeline":           DataPipeline as React.ComponentType<Record<string, unknown>>,
  "event-bus":               EventBus as React.ComponentType<Record<string, unknown>>,
  "pagination-pattern":      PaginationPattern as React.ComponentType<Record<string, unknown>>,
  "model-card":              ModelCard as React.ComponentType<Record<string, unknown>>,
  "prompt-template":         PromptTemplate as React.ComponentType<Record<string, unknown>>,
  "token-counter":           TokenCounter as React.ComponentType<Record<string, unknown>>,
  "service-mesh":            ServiceMesh as React.ComponentType<Record<string, unknown>>,
  "big-word-alert":          BigWordAlert as React.ComponentType<Record<string, unknown>>,
  "real-world-event":        RealWorldEvent as React.ComponentType<Record<string, unknown>>,
  "concept-comparison":      ConceptComparison as React.ComponentType<Record<string, unknown>>,
  "code-diff":               CodeDiff as React.ComponentType<Record<string, unknown>>,
  "tech-decision":           TechDecision as React.ComponentType<Record<string, unknown>>,
  "request-flow":            RequestFlow as React.ComponentType<Record<string, unknown>>,
  "n-plus-one":              NPlusOne as React.ComponentType<Record<string, unknown>>,
  "database-index":          DatabaseIndex as React.ComponentType<Record<string, unknown>>,
  "connection-pool":         ConnectionPool as React.ComponentType<Record<string, unknown>>,
  "cdn-edge":                CdnEdge as React.ComponentType<Record<string, unknown>>,
  "cors-policy":             CorsPolicy as React.ComponentType<Record<string, unknown>>,
  "jwt-flow":                JwtFlow as React.ComponentType<Record<string, unknown>>,
  "ab-test":                 AbTest as React.ComponentType<Record<string, unknown>>,
  "feature-flag":         FeatureFlag as React.ComponentType<Record<string, unknown>>,
  "health-check":         HealthCheck as React.ComponentType<Record<string, unknown>>,
  "deployment-strategy":  DeploymentStrategy as React.ComponentType<Record<string, unknown>>,
  "database-sharding":    DatabaseSharding as React.ComponentType<Record<string, unknown>>,
  "http-cache":           HttpCache as React.ComponentType<Record<string, unknown>>,
  "error-boundary":       ErrorBoundary as React.ComponentType<Record<string, unknown>>,
  "rate-limit-algorithms": RateLimitAlgorithms as React.ComponentType<Record<string, unknown>>,
  "jwt-claims":            JwtClaims as React.ComponentType<Record<string, unknown>>,
  "tcp-handshake":         TcpHandshake as React.ComponentType<Record<string, unknown>>,
  "sql-joins":             SqlJoins as React.ComponentType<Record<string, unknown>>,
  "cache-strategies":         CacheStrategies as React.ComponentType<Record<string, unknown>>,
  "microservice-boundaries":  MicroserviceBoundaries as React.ComponentType<Record<string, unknown>>,
  "grpc-vs-rest":             GrpcVsRest as React.ComponentType<Record<string, unknown>>,
  "memory-leak":              MemoryLeak as React.ComponentType<Record<string, unknown>>,
  "load-testing":             LoadTesting as React.ComponentType<Record<string, unknown>>,
  "api-versioning":           ApiVersioning as React.ComponentType<Record<string, unknown>>,
  "message-queue-patterns":   MessageQueuePatterns as React.ComponentType<Record<string, unknown>>,
  "password-hashing":         PasswordHashing as React.ComponentType<Record<string, unknown>>,
  "environment-config":       EnvironmentConfig as React.ComponentType<Record<string, unknown>>,
  "openapi-spec":             OpenApiSpec as React.ComponentType<Record<string, unknown>>,
  "circuit-breaker-states":   CircuitBreakerStates as React.ComponentType<Record<string, unknown>>,
  "graphql-schema":           GraphQLSchema as React.ComponentType<Record<string, unknown>>,
  "network-latency":  NetworkLatency as React.ComponentType<Record<string, unknown>>,
  "event-sourcing":   EventSourcing as React.ComponentType<Record<string, unknown>>,
  "webhook-security": WebhookSecurity as React.ComponentType<Record<string, unknown>>,
  "two-factor-auth":      TwoFactorAuth as React.ComponentType<Record<string, unknown>>,
  "index-types":          IndexTypes as React.ComponentType<Record<string, unknown>>,
  "container-networking":  ContainerNetworking as React.ComponentType<Record<string, unknown>>,
  "database-transactions": DatabaseTransactions as React.ComponentType<Record<string, unknown>>,
  "service-discovery":     ServiceDiscovery as React.ComponentType<Record<string, unknown>>,
  "distributed-tracing":   DistributedTracing as React.ComponentType<Record<string, unknown>>,
  "kubernetes-hpa":        KubernetesHpa as React.ComponentType<Record<string, unknown>>,
  "async-await":           AsyncAwait as React.ComponentType<Record<string, unknown>>,
  "oauth-scopes":          OAuthScopes as React.ComponentType<Record<string, unknown>>,
  "csp-headers":           CspHeaders as React.ComponentType<Record<string, unknown>>,
  "ssh-tunnel":            SshTunnel as React.ComponentType<Record<string, unknown>>,
  "websocket-lifecycle":   WebSocketLifecycle as React.ComponentType<Record<string, unknown>>,
  "query-optimizer":       QueryOptimizer as React.ComponentType<Record<string, unknown>>,
  "docker-compose":        DockerCompose as React.ComponentType<Record<string, unknown>>,
  "lru-cache":             LruCache as React.ComponentType<Record<string, unknown>>,
  "ai-rag":        AiRag as React.ComponentType<Record<string, unknown>>,
  "cqrs-pattern":  CqrsPattern as React.ComponentType<Record<string, unknown>>,
  "saga-pattern":  SagaPattern as React.ComponentType<Record<string, unknown>>,
  "big-o-notation":   BigONotation as React.ComponentType<Record<string, unknown>>,
  "blob-storage":     BlobStorage as React.ComponentType<Record<string, unknown>>,
  "skeleton-loading": SkeletonLoading as React.ComponentType<Record<string, unknown>>,
  "binary-search":         BinarySearch as React.ComponentType<Record<string, unknown>>,
  "dependency-injection":  DependencyInjection as React.ComponentType<Record<string, unknown>>,
  "compression":           Compression as React.ComponentType<Record<string, unknown>>,
  "ai-embeddings":         AiEmbeddings as React.ComponentType<Record<string, unknown>>,
  "virtual-dom":           VirtualDom as React.ComponentType<Record<string, unknown>>,
  "consistent-hashing":    ConsistentHashing as React.ComponentType<Record<string, unknown>>,
  "bloom-filter":          BloomFilter as React.ComponentType<Record<string, unknown>>,
  "api-caching":           ApiCaching as React.ComponentType<Record<string, unknown>>,
  "recursion":             Recursion as React.ComponentType<Record<string, unknown>>,
  "mutex-semaphore":       MutexSemaphore as React.ComponentType<Record<string, unknown>>,
  "multi-region":          MultiRegion as React.ComponentType<Record<string, unknown>>,
  "jwt-refresh":           JwtRefresh as React.ComponentType<Record<string, unknown>>,
  "memoization":           Memoization as React.ComponentType<Record<string, unknown>>,
  "backpressure":          Backpressure as React.ComponentType<Record<string, unknown>>,
  "polling-vs-webhooks":   PollingVsWebhooks as React.ComponentType<Record<string, unknown>>,
  "immutability":            Immutability as React.ComponentType<Record<string, unknown>>,
  "actor-model":             ActorModel as React.ComponentType<Record<string, unknown>>,
  "database-normalization":  DatabaseNormalization as React.ComponentType<Record<string, unknown>>,
  "promise-combinators":  PromiseCombinators as React.ComponentType<Record<string, unknown>>,
  "proxy-reverse-proxy":  ProxyReverseProxy as React.ComponentType<Record<string, unknown>>,
  "serverless":           Serverless as React.ComponentType<Record<string, unknown>>,
  "heap-data-structure":  HeapDataStructure as React.ComponentType<Record<string, unknown>>,
  "dead-letter-queue":    DeadLetterQueue as React.ComponentType<Record<string, unknown>>,
  "dns-propagation":      DnsPropagation as React.ComponentType<Record<string, unknown>>,
  "reactive-streams":    ReactiveStreams as React.ComponentType<Record<string, unknown>>,
  "service-worker":      ServiceWorker as React.ComponentType<Record<string, unknown>>,
  "kubernetes-ingress":  KubernetesIngress as React.ComponentType<Record<string, unknown>>,
  "cursor-pagination":   CursorPagination as React.ComponentType<Record<string, unknown>>,
  "tree-shaking":        TreeShaking as React.ComponentType<Record<string, unknown>>,
  "dark-mode":           DarkMode as React.ComponentType<Record<string, unknown>>,
  "solid-principles": SolidPrinciples as React.ComponentType<Record<string, unknown>>,
  "slo-sli-sla":      SloSliSla as React.ComponentType<Record<string, unknown>>,
  "http3-quic":       Http3Quic as React.ComponentType<Record<string, unknown>>,
  "design-patterns":  DesignPatterns as React.ComponentType<Record<string, unknown>>,
  "data-replication": DataReplication as React.ComponentType<Record<string, unknown>>,
  "feature-rollout":  FeatureRollout as React.ComponentType<Record<string, unknown>>,
  "idempotency-key":      IdempotencyKey as React.ComponentType<Record<string, unknown>>,
  "idempotency-consumer": IdempotencyConsumer as React.ComponentType<Record<string, unknown>>,
  "stack-vs-queue":       StackVsQueue as React.ComponentType<Record<string, unknown>>,
  "session-vs-jwt":       SessionVsJwt as React.ComponentType<Record<string, unknown>>,
  "graceful-shutdown":    GracefulShutdown as React.ComponentType<Record<string, unknown>>,
  "hash-table-collision": HashTableCollision as React.ComponentType<Record<string, unknown>>,
  "leader-election":      LeaderElection as React.ComponentType<Record<string, unknown>>,
  "context-window-overflow": ContextWindowOverflow as React.ComponentType<Record<string, unknown>>,
  "hmac-signing":         HmacSigning as React.ComponentType<Record<string, unknown>>,
  "rate-limit-headers":   RateLimitHeaders as React.ComponentType<Record<string, unknown>>,
  "two-phase-commit":     TwoPhaseCommit as React.ComponentType<Record<string, unknown>>,
  "graph-traversal-bfs-dfs": GraphTraversalBfsDfs as React.ComponentType<Record<string, unknown>>,
  "read-repair":          ReadRepair as React.ComponentType<Record<string, unknown>>,
  "acid-vs-base":         AcidVsBase as React.ComponentType<Record<string, unknown>>,
  "websocket-vs-sse":     WebSocketVsSse as React.ComponentType<Record<string, unknown>>,
  "priority-queue":         PriorityQueue as React.ComponentType<Record<string, unknown>>,
  "content-negotiation":    ContentNegotiation as React.ComponentType<Record<string, unknown>>,
  "prompt-injection-guard": PromptInjectionGuard as React.ComponentType<Record<string, unknown>>,
  "cap-theorem":            CapTheorem as React.ComponentType<Record<string, unknown>>,
  "trie-prefix-tree":       TriePrefixTree as React.ComponentType<Record<string, unknown>>,
  "wal-write-ahead-log":    WalWriteAheadLog as React.ComponentType<Record<string, unknown>>,
  "gossip-protocol":        GossipProtocol as React.ComponentType<Record<string, unknown>>,
  "conditional-requests-etag": ConditionalRequestsEtag as React.ComponentType<Record<string, unknown>>,
  "tcp-vs-udp":                TcpVsUdp as React.ComponentType<Record<string, unknown>>,
  "union-find-disjoint-set":   UnionFindDisjointSet as React.ComponentType<Record<string, unknown>>,
  "retry-after-header":       RetryAfterHeader as React.ComponentType<Record<string, unknown>>,
  "tool-calling-flow":        ToolCallingFlow as React.ComponentType<Record<string, unknown>>,
  "isolation-levels":         IsolationLevels as React.ComponentType<Record<string, unknown>>,
  "vector-clock":             VectorClock as React.ComponentType<Record<string, unknown>>,
  "rag-chunking":             RagChunking as React.ComponentType<Record<string, unknown>>,
  "raft-consensus":           RaftConsensus as React.ComponentType<Record<string, unknown>>,
  "oauth2-pkce-flow":         OAuth2PkceFlow as React.ComponentType<Record<string, unknown>>,
  "deadlock-detection":       DeadlockDetection as React.ComponentType<Record<string, unknown>>,
  "mtls-handshake":           MtlsHandshake as React.ComponentType<Record<string, unknown>>,
  "red-black-tree":           RedBlackTree as React.ComponentType<Record<string, unknown>>,
  "embedding-similarity":     EmbeddingSimilarity as React.ComponentType<Record<string, unknown>>,
  "webhook-replay":           WebhookReplay as React.ComponentType<Record<string, unknown>>,
  "consistent-reads":         ConsistentReads as React.ComponentType<Record<string, unknown>>,
  "icmp-ping-traceroute":     IcmpPingTraceroute as React.ComponentType<Record<string, unknown>>,
};

export function LivePreview({
  entryId,
  props,
  darkMode,
}: {
  entryId: string;
  props: Record<string, unknown>;
  darkMode: boolean;
}) {
  const Component = COMPONENT_MAP[entryId];

  if (!Component) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-400">
        Component <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{entryId}</code> is not wired to LivePreview yet.
      </div>
    );
  }

  return (
    <div className={cn(darkMode ? "dark" : "")}>
      <Component {...props} />
    </div>
  );
}
