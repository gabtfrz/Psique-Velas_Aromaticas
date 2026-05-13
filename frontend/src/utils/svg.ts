export function escalarValores(valores: number[], alturaMax: number): number[] {
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  const intervalo = max - min || 1
  return valores.map((v) => ((v - min) / intervalo) * alturaMax)
}

export function calcularPontosLinha(
  valores: number[],
  largura: number,
  altura: number
): string {
  if (valores.length === 0) return ''
  const escalados = escalarValores(valores, altura)
  const passoX = largura / (valores.length - 1)
  return escalados
    .map((v, i) => `${i * passoX},${altura - v}`)
    .join(' ')
}

export function calcularArcoRosca(
  pct: number,
  anguloInicio: number,
  raioExt: number,
  raioInt: number,
  cx: number,
  cy: number
): string {
  const angulo = pct * 2 * Math.PI
  const anguloFim = anguloInicio + angulo
  const grandArco = angulo > Math.PI ? 1 : 0

  const x1Ext = cx + raioExt * Math.cos(anguloInicio)
  const y1Ext = cy + raioExt * Math.sin(anguloInicio)
  const x2Ext = cx + raioExt * Math.cos(anguloFim)
  const y2Ext = cy + raioExt * Math.sin(anguloFim)

  const x1Int = cx + raioInt * Math.cos(anguloFim)
  const y1Int = cy + raioInt * Math.sin(anguloFim)
  const x2Int = cx + raioInt * Math.cos(anguloInicio)
  const y2Int = cy + raioInt * Math.sin(anguloInicio)

  return [
    `M ${x1Ext} ${y1Ext}`,
    `A ${raioExt} ${raioExt} 0 ${grandArco} 1 ${x2Ext} ${y2Ext}`,
    `L ${x1Int} ${y1Int}`,
    `A ${raioInt} ${raioInt} 0 ${grandArco} 0 ${x2Int} ${y2Int}`,
    'Z',
  ].join(' ')
}
