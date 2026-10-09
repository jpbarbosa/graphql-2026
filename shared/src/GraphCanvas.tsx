import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from 'react-force-graph-2d'
import { colors, linkColors, type GraphHighlight, type GraphLink, type GraphNode } from './graph'

type Node = NodeObject<GraphNode>
type Link = LinkObject<GraphNode, GraphLink>

interface Props {
  nodes: GraphNode[]
  links: GraphLink[]
  neighbours: Map<string, Set<string>>
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Nodes and links to keep lit while everything else fades, such as a shortest path. */
  highlight?: GraphHighlight | null
}

const endId = (end: string | number | { id?: string | number } | undefined) => (typeof end === 'object' ? String(end.id) : String(end))

/** Renders any client's graph; the data fetching stays in each app's own MovieGraph. */
export function GraphCanvas({ nodes, links, neighbours, selectedId, onSelect, highlight }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const graph = useRef<ForceGraphMethods<Node, Link>>(undefined)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const fitted = useRef(false)
  const positions = useRef(new Map<string, { x: number; y: number }>())
  // Filters and paths rebuild the node objects, which would restart every node from the origin.
  // Seeding each from where the same id last settled keeps the layout steady across rebuilds.
  const graphData = useMemo(() => {
    for (const node of nodes as Node[]) {
      const last = positions.current.get(node.id)
      if (last && node.x === undefined) Object.assign(node, last)
    }
    return { nodes, links }
  }, [nodes, links])
  // A path outranks the selection, whose panel is often how the path was just chosen.
  const focusId = hoveredId ?? (highlight ? null : selectedId)
  const isNear = (id: string) => !focusId || id === focusId || neighbours.get(focusId)?.has(id)
  const isLit = (id: string) => (focusId ? isNear(id) : !highlight || highlight.nodeIds.has(id))
  const fit = () =>
    highlight?.nodeIds.size
      ? graph.current?.zoomToFit(600, 80, (node) => highlight.nodeIds.has(node.id as string))
      : graph.current?.zoomToFit(400, 40)

  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const mounted = size.width > 0
  useEffect(() => {
    if (!mounted || !graph.current) return
    fitted.current = false
    graph.current.d3Force('charge')?.strength(-90).distanceMax(260)
    graph.current.d3Force('link')?.distance(28)
    graph.current.d3Force('gravity', gravity(0.06))
    graph.current.d3ReheatSimulation()
  }, [nodes, mounted])

  useEffect(() => {
    if (fitted.current) fit()
  }, [highlight])

  return (
    <div ref={container} className="absolute inset-0">
      {size.width > 0 && (
        <ForceGraph2D<GraphNode, GraphLink>
          ref={graph}
          graphData={graphData}
          width={size.width}
          height={size.height}
          backgroundColor="#fafaf9"
          cooldownTicks={150}
          onEngineStop={() => {
            for (const node of graphData.nodes as Node[]) {
              if (node.x !== undefined && node.y !== undefined) positions.current.set(node.id, { x: node.x, y: node.y })
            }
            if (fitted.current) return
            fitted.current = true
            fit()
          }}
          nodeRelSize={4}
          nodeVal={(node) => (node.kind === 'person' ? 1 + node.degree : 3 + node.degree / 2)}
          nodeCanvasObject={(node, context, scale) => {
            const radius = Math.sqrt(node.kind === 'person' ? 1 + node.degree : 3 + node.degree / 2) * 4
            context.globalAlpha = isLit(node.id) ? 1 : 0.15
            context.beginPath()
            context.arc(node.x!, node.y!, radius, 0, 2 * Math.PI)
            context.fillStyle = colors[node.kind]
            context.fill()
            if (node.id === selectedId) {
              context.lineWidth = 2 / scale
              context.strokeStyle = '#1c1917'
              context.stroke()
            } else if (node.fromPath) {
              context.setLineDash([2 / scale, 2 / scale])
              context.lineWidth = 1.5 / scale
              context.strokeStyle = '#1c1917'
              context.stroke()
              context.setLineDash([])
            }
            const showLabel = focusId
              ? isNear(node.id)
              : highlight
                ? highlight.nodeIds.has(node.id)
                : node.kind === 'person'
                ? scale > 3 || (scale > 1.6 && node.degree > 3)
                : scale > 1.2 || node.degree > 6
            if (showLabel) {
              const fontSize = Math.max(11 / scale, 2)
              context.font = `${node.kind === 'movie' ? 600 : 400} ${fontSize}px ui-sans-serif, system-ui, sans-serif`
              context.textAlign = 'center'
              context.textBaseline = 'top'
              context.fillStyle = '#1c1917'
              context.fillText(node.label, node.x!, node.y! + radius + 1.5 / scale)
            }
            context.globalAlpha = 1
          }}
          nodePointerAreaPaint={(node, color, context) => {
            const radius = Math.sqrt(node.kind === 'person' ? 1 + node.degree : 3 + node.degree / 2) * 4 + 2
            context.fillStyle = color
            context.beginPath()
            context.arc(node.x!, node.y!, radius, 0, 2 * Math.PI)
            context.fill()
          }}
          linkColor={(link) => {
            if (focusId) return endId(link.source) === focusId || endId(link.target) === focusId ? linkColors[link.kind] : 'rgba(0,0,0,0.04)'
            if (highlight) return highlight.linkIds.has(link.id) ? '#1c1917' : 'rgba(0,0,0,0.04)'
            return linkColors[link.kind]
          }}
          linkWidth={(link) => (highlight?.linkIds.has(link.id) ? 3 : link.kind === 'DIRECTOR' ? 2 : 1)}
          linkDirectionalParticles={(link) => (highlight?.linkIds.has(link.id) ? 3 : 0)}
          linkDirectionalParticleWidth={3}
          linkLineDash={(link) => (link.kind === 'WRITER' ? [3, 2] : null)}
          onNodeHover={(node) => setHoveredId((node?.id as string | undefined) ?? null)}
          onNodeClick={(node) => onSelect(node.id as string)}
          onBackgroundClick={() => onSelect(null)}
        />
      )}
    </div>
  )
}

// Unconnected clusters (a movie whose cast appears nowhere else) drift off under the charge
// force alone; a weak pull toward the origin keeps the whole graph inside one zoom level.
function gravity(strength: number) {
  let nodes: Node[] = []
  const force = (alpha: number) => {
    for (const node of nodes) {
      node.vx = (node.vx ?? 0) - (node.x ?? 0) * strength * alpha
      node.vy = (node.vy ?? 0) - (node.y ?? 0) * strength * alpha
    }
  }
  force.initialize = (all: Node[]) => {
    nodes = all
  }
  return force
}
