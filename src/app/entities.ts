import {ArraySchema, MapSchema, Schema, type} from "@colyseus/schema";

export class Block extends Schema {
  @type("number")
  value: number = 0;

  @type("boolean")
  checked: boolean = false;
}

export class Chit extends Schema {
  @type([Block])
  firstRow = new ArraySchema<Block>();

  @type([Block])
  secondRow = new ArraySchema<Block>();

  @type([Block])
  thirdRow = new ArraySchema<Block>();

}

export class Player extends Schema {
  @type("string")
  name: string = "UN-NAMED";

  @type(Chit)
  chit: Chit = new Chit();
}

export class GameState extends Schema {
  @type({map: Player})
  players = new MapSchema<Player>();

  @type("string")
  currentPlayerId = "";

  @type(["number"])
  pickedNumbers = new ArraySchema<number>();
}

export interface WonPlayer {
  playerId: string,
  position: number,
  name: string
}