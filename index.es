import React, {Component} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'
import {Button, Container, Row, Col, Tabs, Tab, ListGroup, ListGroupItem, Nav, NavItem, Content, Pane} from 'react-bootstrap'

import {store} from 'views/create-store'

import {join} from 'path'

import {extensionSelectorFactory} from 'views/utils/selectors'

const EXTENSION_KEY = 'poi-plugin-fetchtaisen';

const pluginDataSelector = createSelector(
  extensionSelectorFactory(EXTENSION_KEY),
  (state) => state || {}
)

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

  getAllTaisenEquipTypes(){
    var allEquipTypes = this.props.$equips;
    var ret = {};
    for(var p in allEquipTypes){
      var tais = allEquipTypes[p].api_tais;
      var name = allEquipTypes[p].api_name;
      if(tais>0){
        ret[p]=[tais,name];
      }
    }
    return ret;
  }

  getAllTaisenEquips(){
    var taisenEquipTypes = this.getAllTaisenEquipTypes();
    var allEquips = this.props.equips;
    var ret = {};
    var cret = {};
    for(var p in allEquips){
      var equipid = allEquips[p].api_slotitem_id;
      var taisArr = taisenEquipTypes[equipid];
      if(taisArr){
        var tais = taisArr[0];
        var name = taisArr[1];
        ret[p]=tais;
        if(cret[tais]==undefined){
          cret[tais]={count:0};
        }
        if(cret[tais][name]==undefined){
          cret[tais][name]=0;
        }
        cret[tais].count++;
        cret[tais][name]++;
      }
    }
    return [ret,cret];
  }

  getAllTaisenShipD() {
    var fleetmap = this.getfleetmap();
    var allships = this.props.ships;
    var allTaisenEquipsArr = this.getAllTaisenEquips();
    var allTaisenEquips = allTaisenEquipsArr[0];
    var taisenEquips = allTaisenEquipsArr[1];
    console.log(taisenEquips);
    var taisenships = {};
    var shiplvarr = [];
    for (var p in allships) {
      var ship = allships[p];
      var taisen = ship.api_taisen[0];
      var slots = ship.api_slot;
      var equiptaisen = 0;
      for(var i=0;i<slots.length;i++){
        var equipid = slots[i];
        if(allTaisenEquips[equipid]){
          equiptaisen+=allTaisenEquips[equipid];
        }
      }
      var oritaisen = taisen-equiptaisen;
      var slotnum = ship.api_slotnum;
      if(oritaisen+slotnum*12>80){
        var infoshipid = ship.api_ship_id;
        var shiptypenamearr = this.getShipTypeAndName(infoshipid);
        var shiptype = shiptypenamearr[0];
        var shipname = shiptypenamearr[1];
        if(taisenships[shiptype]==undefined){
          taisenships[shiptype]=[]
        }
        taisenships[shiptype].push([shipname,ship.api_lv,oritaisen,slotnum]);
      }
    }
    return [fleetmap,taisenships,taisenEquips];
  }

  render() {
    const taiseninfo = this.getAllTaiSenShip();
    const fleetmap = taiseninfo[0];
    const alltaisenships = taiseninfo[1];
    let shiptypes = ["全部", "驱逐", "轻巡", "重巡", "战舰", "空母", "潜艇", "其他"];
    const mergeShip = (type) => {
      switch (type) {
        case "全部":
          return ["駆逐艦", "軽巡洋艦", "重雷装巡洋艦", "重巡洋艦", "航空巡洋艦", "戦艦", "航空戦艦", "超弩級戦艦", "水上機母艦", "軽空母", "正規空母", "装甲空母", "潜水艦", "潜水空母", "揚陸艦", "工作艦", "補給艦", "練習巡洋艦", "潜水母艦"];
        case "驱逐":
          return ["駆逐艦"];
        case "轻巡":
          return ["軽巡洋艦", "重雷装巡洋艦"];
        case "重巡":
          return ["重巡洋艦", "航空巡洋艦"];
        case "战舰":
          return ["戦艦", "航空戦艦", "超弩級戦艦"];
        case "空母":
          return ["水上機母艦", "軽空母", "正規空母", "装甲空母"];
        case "潜艇":
          return ["潜水艦", "潜水空母"];
        default:
          return ["揚陸艦", "工作艦", "補給艦", "練習巡洋艦", "潜水母艦"];
      }
    };
    return (
      <div id="fetchcond" className="antisub">
        {Object.keys(alltaisenships).map(function(shiptype){
          var list = alltaisenships[shiptype];
          return(
            <div>
              <div>{shiptype}:{list.length}</div>
              {list.map(function(ship){
                return(
                  <div>
                    {ship[0]} lv.{ship[1]} {ship[2]} {ship[3]}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

    )


  }
});