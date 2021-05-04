import { Component, Input, SimpleChanges } from '@angular/core';
import { ColyseusClient } from './colyseus.client'
import { from } from 'rxjs';
import { Client, Room } from 'colyseus.js';
import * as queryString from 'query-string';
import { Player, GameState, WonPlayer } from './entities';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'alobmat';
  gameStarted: boolean = false;
  defalutTab:String ="create"
  tiles: any[];
  chit: any;
  shareUrl: string;
  rows = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  columns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  buttonText = "Create Room";
  players:String[];
  joinError:boolean = false;
  nickName:String="";
  room: Room<GameState>;
  playerId: string;
  roomId:string ="";
  sessionId:String;
  client = new ColyseusClient();
  oppenents:any;
  isPlayerTurn:boolean;
  turnMessage:String;
  pickMessage:string;
  pickedNumbers:String[];
  isStarted:boolean = false;
  playerRank:number = 0;
  isSpin:boolean =false;
  isJoinVisible:boolean=false;
  victoryMessage:string="Congratulations!!! You Won";

  constructor(private toastr: ToastrService) {}
  
  ngOnInit() {
    this.players = new Array();
    this.tiles = new Array();
    this.oppenents =new Map();
    this.pickedNumbers= new Array();
    if(queryString.parse(window.location.search)['roomId']) {
      this.defalutTab="join";
      this.roomId = queryString.parse(window.location.search)['roomId'].toString();
    }
    var entries;
    for (var i = 0; i <= 8; i++) {
      entries = new Array();
      for (var j = 1; j <= 10; j++) {
        entries.push({
          value: i * 10 + j,
          isEnabled: false
        });
      }
      this.tiles.push(entries);
    }
  }

  showToast(message:string) {
    this.toastr.success(message, '',
    {timeOut: 2000});
  }

  processChit(chit) {
    chit.firstRow = this.processRow(chit.firstRow);
    chit.secondRow = this.processRow(chit.secondRow);
    chit.thirdRow = this.processRow(chit.thirdRow);
    chit.count = this.getCount(chit);
    return chit;
  }

  getCount(chit) :number {
    return this.getRowCount(chit.firstRow) + this.getRowCount(chit.secondRow) + this.getRowCount(chit.thirdRow);
  }
  getRowCount(firstRow):number {
    var c=0;
    firstRow.forEach(element => {
      if(element.checked) {
        c++;
      }
    });
    return c;
  }
  processRow(row) {
    var resultRow = [{ value: '*', checked: false }, { value: '*', checked: false }, { value: '*', checked: false },
    { value: '*', checked: false }, { value: '*', checked: false }, { value: '*', checked: false },
    { value: '*', checked: false }, { value: '*', checked: false }, { value: '*', checked: false }];
    let pos = 0;
    for (var i = 0; i < row.length; i++) {
      if(row[i].value % 10 == 0){
        pos=Math.floor(row[i].value / 10)-1;
      } else {
        pos=Math.floor(row[i].value / 10);
      }            
      //resultRow[pos].checked = row[i].checked;
      if(!row[i].checked) {
        resultRow[pos].value = '*';
      } else {
        resultRow[pos].value = row[i].value;
        resultRow[pos].checked = row[i].checked;
      }     
    }
    return resultRow;
  }
  onCreateClick() {
    var self = this;
    if (this.buttonText === "Create Room") {
      this.isSpin =true;      
      self.buttonText = "Start";
      this.client.create(this.nickName).then((room:Room<GameState>) => {
        self.isSpin =false;
        self.room = room;
        self.roomId = room.id;
        self.sessionId = room.sessionId;
        
        self.shareUrl = window.location.origin + '?roomId=' + room.id;           
        self.room.state.players.onAdd = function(player, i) {
          if(i != self.sessionId) {
            self.players.push(player.name);
          }
        }
      }).catch(e => {
        self.isSpin =false;
        this.joinError =true;
        }); 
    } else {
      this.setMessageListener();
      this.room.send({startGame: true});
  }
}
  onJoinClick() {
    let self = this;
    self.isSpin =true;
    self.isJoinVisible=true;
    this.client.join(this.nickName, this.roomId).then(room => {
      self.isSpin=false;
      self.joinError =false;      
      self.room = room;
      self.setMessageListener();
      self.sessionId =room.sessionId;
      self.shareUrl = window.location.origin + '?roomId=' + room.id;
      room.state.players.onAdd = function(player, i) {
        if(i != self.sessionId) {
          self.players.push(player.name);
        }        
      }      
    }).catch(e =>{
      self.isSpin=false;
      this.joinError =true;
    });
  }

  private setMessageListener() {
    var self=this;
    this.startGame();
    this.room.onMessage((message) => {
      if (message === 'start') {                
        self.isStarted =true;
      } else if (message.nextTurnPlayerId) {
        self.isPlayerTurn = message.nextTurnPlayerId === this.sessionId;
        const pickedNumber = message.pickedNumber;
        self.pickedNumbers.push(message.pickedNumber);
        const pickedByPlayer = message.currentPlayerId === this.sessionId;
        const pickedPlayerName = message.currentPlayerName;
        const nextPlayerName = message.nextTurnPlayerName;
        if(nextPlayerName == this.nickName) {
          self.turnMessage = "Your turn";
        } else {
          self.turnMessage = `waiting for ${nextPlayerName}`;
        }       
        if (pickedNumber) {
          self.pickMessage = pickedByPlayer ? `You picked ${pickedNumber}` :
              `${pickedPlayerName} picked ${pickedNumber}`;
          self.showToast(self.pickMessage);    
        }        
      } else if (message.event) {
        const wonResponses: Array<WonPlayer> = message.positions;
        const hasPlayerWon = wonResponses.filter(resp => resp.playerId === self.sessionId).length > 0;
        if (hasPlayerWon) {
          const playerPosition = wonResponses.find(resp => resp.playerId === self.sessionId).position;        
          this.playerRank = playerPosition;       
          this.victoryMessage = self.getText(self.playerRank);   
        } else {
          wonResponses.forEach(resp=>{
            var player=self.oppenents.get(resp.playerId)
            player.playerRank =resp.position;
            player.victoryMessage = self.getText(resp.position);
            self.oppenents.set(resp.playerId, player);
          });
        }
        
      } 
    });
  }

  onGridClick(event:any) {
    if(this.isPlayerTurn) {
      this.isPlayerTurn=null;
      this.room.send({number: event});
    }
  }

  getValues() {
    return Array.from(this.oppenents.values());
}

  startGame() {
    var self =this;
    this.room.state.players.onChange = (player: Player, id: string) => {
      if(self.isStarted) {
        self.gameStarted = true;      
      }
      const chit = JSON.parse(JSON.stringify(player.chit));
      if(id == self.sessionId) {
        this.chit = self.processChit(chit);
      } else {
        self.oppenents.set(id, {
          name : player.name,
          id: id,
          chit: self.processChit(chit),
          playerRank:0,
          victoryMessage:''
        });
      }
      
    };
  }

  getText(num:number) {
    if(num == 1) {
      return "Congratulations!!! You Won";
    } else {
      return "You finished with "+num;
    }
  }

}
