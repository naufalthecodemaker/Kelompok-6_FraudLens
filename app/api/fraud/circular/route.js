// app/api/fraud/circular/route.js
import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function GET() {
  const session = driver.session();
  
  try {
    const query = `
      MATCH (source)-[relationship]->(target)
      RETURN source, relationship, target
    `;
    
    const result = await session.run(query);
    
    const nodesMap = new Map();
    const links = [];

    result.records.forEach((record) => {
      const sourceNode = record.get('source');
      const targetNode = record.get('target');
      const rel = record.get('relationship');

      const sourceId = sourceNode.properties.id;
      const targetId = targetNode.properties.id;

      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, {
          ...sourceNode.properties, 
          label: sourceNode.labels[0],
        });
      }

      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, {
          ...targetNode.properties,
          label: targetNode.labels[0],
        });
      }

      let cleanAmount = rel.properties.amount;
      if (cleanAmount && typeof cleanAmount === 'object' && cleanAmount.low !== undefined) {
        cleanAmount = cleanAmount.toNumber(); 
      }

      links.push({
        ...rel.properties, 
        source: sourceId, 
        target: targetId, 
        type: rel.type,
        amount: cleanAmount 
      });
    });

    const formattedData = {
      nodes: Array.from(nodesMap.values()),
      links: links
    };

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Gagal mengeksekusi query:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await session.close();
  }
}