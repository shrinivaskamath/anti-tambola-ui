
import {Client, Room} from 'colyseus.js'
import { GameState, Player } from './entities';

export class ColyseusClient {

    client = new Client(this.getEndpoint());

     create(name): Promise<any> {
        let options = {name: name};

        return this.client.create<GameState>('my_room', options);
    }

    join(name, roomId): Promise<Room<GameState>> {
        let options = {name: name};
        return this.client.joinById<GameState>(roomId, options);
    }


    start(room) {
        room.send({startGame:true});
    }

    getUrl(id) {

    }

    getEndpoint() {
        return 'wss://anti-tambola-server.herokuapp.com/'
    }

}
