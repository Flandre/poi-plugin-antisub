import React, {Component} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'
import {Container, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl} from 'react-bootstrap'

import {store} from 'views/create-store'

import {join} from 'path'

import {extensionSelectorFactory} from 'views/utils/selectors'

const EXTENSION_KEY = 'poi-plugin-antisub';

const pluginDataSelector = createSelector(
  extensionSelectorFactory(EXTENSION_KEY),
  (state) => state || {}
)

const MaxAntiSub = 88;

export const reactClass = connect(
  state => ({
    horizontal: state.config.poi.layout || 'horizontal',
    $ships: state.const.$ships,
    ships: state.info.ships,
    fleets: state.info.fleets,
    $equips: state.const.$equips,
    equips: state.info.equips,
    $shipTypes: state.const.$shipTypes
  }),
  null, null, {pure: false}
)(class PluginFetchTaisen extends Component {


  getfleetmap() {
    var fleetarr = this.props.fleets;
    var fleetmap = {};
    for (var i = 0; i < fleetarr.length; i++) {
      var nships = fleetarr[i].api_ship;
      for (var j = 0; j < nships.length; j++) {
        fleetmap[nships[j]] = i + 1;
      }
    }
    return fleetmap;
  }

  getAllTaiSenShip() {
    try {
      var ret = this.getAllTaisenShipD();
      return ret;
    } catch (e) {
      console.log(e);
      return "unknown error";
    }
  }

  getShipTypeAndName(infoshipid) {
    var shipinfo = this.props.$ships[infoshipid];
    if (shipinfo == undefined) {
      return ["error", "error"]
    }
    var shiptype = shipinfo.api_stype;
    var shipname = shipinfo.api_name;
    var shipTypeInfo = this.props.$shipTypes[shiptype];
    var shipTypeStr = shipTypeInfo.api_name;
    return [shipTypeStr, shipname];
  }

  getAllTaisenEquipTypes() {
    var allEquipTypes = this.props.$equips;
    var ret = {};
    for (var p in allEquipTypes) {
      var tais = allEquipTypes[p].api_tais;
      var name = allEquipTypes[p].api_name;
      if (tais > 0) {
        ret[p] = [tais, name];
      }
    }
    return ret;
  }

  getAllTaisenEquips() {
    var taisenEquipTypes = this.getAllTaisenEquipTypes();
    var allEquips = this.props.equips;
    var ret = {};
    var cret = {};
    for (var p in allEquips) {
      var equipid = allEquips[p].api_slotitem_id;
      var taisArr = taisenEquipTypes[equipid];
      if (taisArr) {
        var tais = taisArr[0];
        var name = taisArr[1];
        ret[p] = tais;
        if (cret[tais] == undefined) {
          cret[tais] = {count: 0};
        }
        if (cret[tais][name] == undefined) {
          cret[tais][name] = 0;
        }
        cret[tais].count++;
        cret[tais][name]++;
      }
    }
    var tret = [];
    tret[0] = cret[5]?(cret[5]["九四式爆雷投射機"]?cret[5]["九四式爆雷投射機"]:0):0;
    tret[1] = cret[8]?(cret[8]["三式爆雷投射機"]?cret[8]["三式爆雷投射機"]:0):0;
    tret[2] = cret[6]?(cret[6]["九三式水中聴音機"]?cret[6]["九三式水中聴音機"]:0):0;
    tret[3] = cret[10]?(cret[10]["三式水中探信儀"]?cret[10]["三式水中探信儀"]:0):0;
    tret[4] = cret[12]?(cret[12]["四式水中聴音機"]?cret[12]["四式水中聴音機"]:0):0;
    return [ret, cret,tret];
  }

  getAllTaisenShipD() {
    var fleetmap = this.getfleetmap();
    var allships = this.props.ships;
    var allTaisenEquipsArr = this.getAllTaisenEquips();
    var allTaisenEquips = allTaisenEquipsArr[0];
    var taisenEquips = allTaisenEquipsArr[2];
    if(MaxAntiSub < 100 && taisenEquips[4]==0){ // test only
      taisenEquips[4] = 2;
    }
    var taisenships = {};
    var shiplvarr = [];
    for (var p in allships) {
      var ship = allships[p];
      var taisen = ship.api_taisen[0];
      var slots = ship.api_slot;
      var equiptaisen = 0;
      for (var i = 0; i < slots.length; i++) {
        var equipid = slots[i];
        if (allTaisenEquips[equipid]) {
          equiptaisen += allTaisenEquips[equipid];
        }
      }
      var oritaisen = taisen - equiptaisen;
      var slotnum = ship.api_slotnum;
      if (oritaisen + slotnum * 12 > MaxAntiSub) {
        var infoshipid = ship.api_ship_id;
        var shiptypenamearr = this.getShipTypeAndName(infoshipid);
        var shiptype = shiptypenamearr[0];
        var shipname = shiptypenamearr[1];
        if (taisenships[shiptype] == undefined) {
          taisenships[shiptype] = []
        }
        var bestEquipArr = this.getBestEquip([shipname, ship.api_lv, oritaisen, slotnum],taisenEquips);
        taisenships[shiptype].push([shipname, ship.api_lv, oritaisen, slotnum,bestEquipArr[0],bestEquipArr[1]]);
      }

    }
    for(var p in taisenships){
      var list = taisenships[p];
      list.sort(function(a,b){return (b[5]<<8+b[1])-(a[5]<<8+a[1])});
    }
    return [fleetmap, taisenships, taisenEquips];
  }

  getBestEquip(ship,taisenEquips){
    var oritaisen = ship[2];
    var slotnum = ship[3];
    var needEquipTaisen = MaxAntiSub - oritaisen;
    var ret = [];
    var can = 1;
    if(needEquipTaisen>=slotnum*12-4){
      if(needEquipTaisen>=slotnum*12-2){
        if(slotnum==3){
          ret = [4,4,4];
          if(taisenEquips[4]<3){
            can=0;
          }
        }else{
          ret = [4,4,4,4];
          if(taisenEquips[4]<4){
            can=0;
          }
        }
      }else{
        if(slotnum==3){
          ret = [3,4,4];
          if(taisenEquips[4]<2){
            can=0;
          }
        }else{
          ret = [3,4,4,4];
          if(taisenEquips[4]<3){
            can=0;
          }
        }
      }
    }else{
      var needYtaisen = needEquipTaisen - 8;
      var Yslotnum = slotnum-1;
      if(slotnum==3){
        if(needYtaisen<=6*Yslotnum){
          ret = [1,2,2];
        }else if(needYtaisen<=6*Yslotnum+4){
          ret = [1,2,3];
        }else if(needYtaisen<=6*Yslotnum+8){
          ret = [1,3,3];
        }else if(needYtaisen<=6*Yslotnum+10){
          if(taisenEquips[4]>=1){
            ret = [1,3,4];
          }else{
            if(taisenEquips[3]<3){
              can=0;
            }
            ret = [3,3,3];
          }

        }else if(needYtaisen<=6*Yslotnum+12){
          ret = [3,3,4];
          if(taisenEquips[4]<1){
            can=0;
          }
        }else if(needYtaisen<=6*Yslotnum+14){
          ret = [3,4,4];
          if(taisenEquips[4]<2){
            can=0;
          }
        }
      }else{
        if(needYtaisen<=6*Yslotnum){
          ret = [1,2,2,2];
        }else if(needYtaisen<=6*Yslotnum+4){
          ret = [1,2,2,3];
        }else if(needYtaisen<=6*Yslotnum+8){
          ret = [1,2,3,3];
        }else if(needYtaisen<=6*Yslotnum+12){
          ret = [1,3,3,3];  //TODO 根据装备在做调整
        }else if(needYtaisen<=6*Yslotnum+14){
          if(taisenEquips[4]>=1){
            ret = [1,3,3,4];
          }else{
            if(taisenEquips[3]<3){
              can=0;
            }
            ret = [3,3,3,3];
          }
        }else if(needYtaisen<=6*Yslotnum+16){
          ret = [1,3,4,4];
          if(taisenEquips[4]<2){
            can=0;
          }
        }else if(needYtaisen<=6*Yslotnum+18){
          ret = [1,4,4,4];
          if(taisenEquips[4]<3){
            can=0;
          }
        }
      }
    }
    var hret = [];
    for(var i=0;i<ret.length;i++){
      if(ret[i] == 0){
        hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/117.png"></img><span className="badge">九四</span></span>)
      }else if(ret[i] == 1){
        hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/117.png"></img><span className="badge">三式</span></span>)
      }else if(ret[i] == 2){
        hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img><span className="badge">九三</span></span>)
      }else if(ret[i] == 3){
        hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img><span className="badge">三式</span></span>)
      }else if(ret[i] == 4){
        hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img><span className="badge">四式</span></span>)
      }
    }
    return [hret,can];
  }

  render() {
    const taiseninfo = this.getAllTaiSenShip();
    const fleetmap = taiseninfo[0];
    const alltaisenships = taiseninfo[1];
    const taisenEquips = taiseninfo[2];
    console.log(taisenEquips);
    let shiptypes = ["駆逐艦", "軽巡洋艦", "重雷装巡洋艦", "練習巡洋艦"];
    let list = [];
    shiptypes.map((shiptype) => {
      let shipList = alltaisenships[shiptype];
      if(shipList){
        list.push(
          <ListGroupItem active>
          <span className="title-type">
            {[shiptype, <span className="badge">{shipList ? shipList.length : 0}</span>]}
          </span>
          </ListGroupItem>
        );
        shipList = shipList ? shipList : [];
        shipList.map((ship) => {
          list.push(
            <ListGroupItem>
              <Row>
                <Col xs={4}>
                  lv.{ship[1]}{ship[0]}
                </Col>
                <Col xs={6}>
                  {ship[5]}{ship[4]}
                </Col>
              </Row>
            </ListGroupItem>
          )
        })
      }
    });
    var eqlist=[];
    if(taisenEquips[0]>0){
      eqlist.push(<span><span className="badge"><img style={{width:"20px"}} src="assets/img/slotitem/117.png"></img>
        九四</span>*{taisenEquips[0]}</span>)
    }
    if(taisenEquips[1]>0){
      eqlist.push(<span><span className="badge"><img style={{width:"20px"}} src="assets/img/slotitem/117.png"></img>
        三式</span>*{taisenEquips[1]}</span>)
    }
    if(taisenEquips[2]>0){
      eqlist.push(<span><span className="badge"><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img>
        九三</span>*{taisenEquips[2]}</span>)
    }
    if(taisenEquips[3]>0){
      eqlist.push(<span><span className="badge"><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img>
        三式</span>*{taisenEquips[3]}</span>)
    }
    if(taisenEquips[4]>0){
      eqlist.push(<span><span className="badge"><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img>
        四式</span>*{taisenEquips[4]}</span>)
    }
    return (
      <div id="antisub" className="antisub">
        <link rel="stylesheet" href={join(__dirname, 'antisub.css')}/>
        <ListGroup>
          <ListGroupItem>
          { eqlist }
          </ListGroupItem>
        </ListGroup>
        <ListGroup>
          <ListGroupItem>
            <Row>
              <Col xs={4}>
                { "舰娘" }
              </Col>
              <Col xs={6}>
                { "最低装备" }
              </Col>
            </Row>
          </ListGroupItem>
        </ListGroup>
        <ListGroup className="list-container">
          { list }
        </ListGroup>
      </div>
    )
  }
});