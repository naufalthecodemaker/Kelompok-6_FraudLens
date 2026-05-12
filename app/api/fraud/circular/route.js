import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target') || '';
  const searchQuery = target.trim().toLowerCase();

  if (!searchQuery) {
    return NextResponse.json({ success: true, data: { nodes: [], links: [] } });
  }

  const session = driver.session();
  
  try {
    const query = `
      MATCH (u:User)
      WHERE toLower(u.name) CONTAINS $searchQuery
      OPTIONAL MATCH path = (u)-[*1..2]-(connectedNode)
      RETURN path, u
    `;
    
    const result = await session.run(query, { searchQuery });
    
    const nodesMap = new Map();
    const links = [];

    if (result.records.length === 0 || !result.records[0].get('u')) {
      return NextResponse.json({ success: true, data: { nodes: [], links: [] } });
    }

    result.records.forEach(record => {
      const path = record.get('path');
      const mainUser = record.get('u');

      if (mainUser && !nodesMap.has(mainUser.elementId)) {
        nodesMap.set(mainUser.elementId, {
          id: mainUser.properties.id || mainUser.elementId,
          label: mainUser.labels[0],
          ...mainUser.properties
        });
      }

      if (path) {
        path.segments.forEach(segment => {
          const start = segment.start;
          const end = segment.end;
          const rel = segment.relationship;

          if (!nodesMap.has(start.elementId)) {
            nodesMap.set(start.elementId, {
              id: start.properties.id || start.elementId,
              label: start.labels[0],
              ...start.properties
            });
          }

          if (!nodesMap.has(end.elementId)) {
            nodesMap.set(end.elementId, {
              id: end.properties.id || end.elementId,
              label: end.labels[0],
              ...end.properties
            });
          }

          let cleanAmount = rel.properties.amount;
          if (cleanAmount && typeof cleanAmount === 'object' && cleanAmount.low !== undefined) {
            cleanAmount = cleanAmount.toNumber(); 
          }

          links.push({
            source: start.properties.id || start.elementId,
            target: end.properties.id || end.elementId,
            type: rel.type,
            amount: cleanAmount,
            ...rel.properties
          });
        });
      }
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