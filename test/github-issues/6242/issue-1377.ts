import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Post} from "./entity/Post";

describe("github issues > #6242 Add support for `GENERATED ALWAYS AS` in Postgres", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly create table with generated columns", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        let table = await queryRunner.getTable("post");
        table!.findColumnByName("storedFullName")!.asExpression!.should.be.equal("concat(`firstName`,' ',`lastName`)");

        const metadata = connection.getMetadata(Post);

        const storedFullNameColumn = metadata.findColumnWithPropertyName("storedFullName");
        storedFullNameColumn!.asExpression = "concat('Mr. ',`firstName`,' ',`lastName`)";
        await connection.synchronize();

        table = await queryRunner.getTable("post");
        table!.findColumnByName("storedFullName")!.asExpression!.should.be.equal("concat('Mr. ',`firstName`,' ',`lastName`)");

        await queryRunner.release();
    })));

});
