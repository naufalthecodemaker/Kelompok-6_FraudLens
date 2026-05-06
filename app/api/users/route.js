import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j'; 

export async function GET() {
  const session = driver.session();
  
  try {
    const result = await session.run('MATCH (u:User) RETURN u');
    
    const users = result.records.map((record) => record.get('u').properties);

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Gagal nyambung ke Neo4j:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await session.close();
  }
}