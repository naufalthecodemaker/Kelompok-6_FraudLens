import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

let driver;

if (!global.neo4jDriver) {
  global.neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));
}
driver = global.neo4jDriver;

export default driver;