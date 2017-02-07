import React, {Component} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'
import {Container, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap'

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
  constructor(props) {
    super(props)
    this.state = {
      test:"testinfo",
      v1:"v1"
    }
  }

  loadstate(){
    var v1 = this.state.v1;
    console.log("v1:"+v1);
  }

  setstate(){
    var v1 = this.state.v1;
    console.log("v1:"+v1);
    if(v1!="v2"){
      this.setState({v1:"v2"});
    }
  }

  getfleetmap() {
    let fleetarr = this.props.fleets;
    let fleetmap = {};
    for (let i = 0; i < fleetarr.length; i++) {
      let nships = fleetarr[i].api_ship;
      for (let j = 0; j < nships.length; j++) {
        fleetmap[nships[j]] = i + 1;
      }
    }
    return fleetmap;
  }

  getAllTaiSenShip() {
    try {
      let ret = this.getAllTaisenShipD();
      return ret;
    } catch (e) {
      console.log(e);
      return "unknown error";
    }
  }

  getShipTypeAndName(infoshipid) {
    let shipinfo = this.props.$ships[infoshipid];
    if (shipinfo == undefined) {
      return ["error", "error"]
    }
    let shiptype = shipinfo.api_stype;
    let shipname = shipinfo.api_name;
    let shipTypeInfo = this.props.$shipTypes[shiptype];
    let shipTypeStr = shipTypeInfo.api_name;
    return [shipTypeStr, shipname];
  }

  getAllTaisenEquipTypes() {
    let allEquipTypes = this.props.$equips;
    let ret = {};
    for (let p in allEquipTypes) {
      let tais = allEquipTypes[p].api_tais;
      let name = allEquipTypes[p].api_name;
      if (tais > 0) {
        ret[p] = [tais, name];
      }
    }
    return ret;
  }

  getAllTaisenEquips() {
    let taisenEquipTypes = this.getAllTaisenEquipTypes();
    let allEquips = this.props.equips;
    let ret = {};
    let cret = {};
    for (let p in allEquips) {
      let equipid = allEquips[p].api_slotitem_id;
      let taisArr = taisenEquipTypes[equipid];
      if (taisArr) {
        let tais = taisArr[0];
        let name = taisArr[1];
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
    let tret = [];
    tret[0] = cret[5] ? (cret[5]["九四式爆雷投射機"] ? cret[5]["九四式爆雷投射機"] : 0) : 0;
    tret[1] = cret[8] ? (cret[8]["三式爆雷投射機"] ? cret[8]["三式爆雷投射機"] : 0) : 0;
    tret[2] = cret[6] ? (cret[6]["九三式水中聴音機"] ? cret[6]["九三式水中聴音機"] : 0) : 0;
    tret[3] = cret[10] ? (cret[10]["三式水中探信儀"] ? cret[10]["三式水中探信儀"] : 0) : 0;
    tret[4] = cret[12] ? (cret[12]["四式水中聴音機"] ? cret[12]["四式水中聴音機"] : 0) : 0;
    return [ret, cret, tret];
  }

  getAllTaisenShipD() {
    let fleetmap = this.getfleetmap();
    let allships = this.props.ships;
    let allTaisenEquipsArr = this.getAllTaisenEquips();
    let allTaisenEquips = allTaisenEquipsArr[0];
    let taisenEquips = allTaisenEquipsArr[2];
    if (MaxAntiSub < 100) { // test only
      if (taisenEquips[4] == 0) {
        taisenEquips[4] = 2;
      }
      if (taisenEquips[3] < 2) {
        taisenEquips[3] += 4;
      }
    }
    let taisenships = {};
    let shiplvarr = [];
    for (let p in allships) {
      let ship = allships[p];
      let taisen = ship.api_taisen[0];
      let slots = ship.api_slot;
      let equiptaisen = 0;
      for (let i = 0; i < slots.length; i++) {
        let equipid = slots[i];
        if (allTaisenEquips[equipid]) {
          equiptaisen += allTaisenEquips[equipid];
        }
      }
      let oritaisen = taisen - equiptaisen;
      let slotnum = ship.api_slotnum;
      if (oritaisen + slotnum * 12 > MaxAntiSub) {
        let infoshipid = ship.api_ship_id;
        let shiptypenamearr = this.getShipTypeAndName(infoshipid);
        let shiptype = shiptypenamearr[0];
        let shipname = shiptypenamearr[1];
        if (taisenships[shiptype] == undefined) {
          taisenships[shiptype] = []
        }
        let bestEquipArr = this.getBestEquip([shipname, ship.api_lv, oritaisen, slotnum], taisenEquips);
        taisenships[shiptype].push([shipname, ship.api_lv, oritaisen, slotnum, bestEquipArr[0], bestEquipArr[1]]);
      }

    }
    for (let p in taisenships) {
      let list = taisenships[p];
      list.sort(function (a, b) {
        return ((b[5] << 8) + b[1]) - ((a[5] << 8) + a[1])
      });
    }
    return [fleetmap, taisenships, taisenEquips];
  }

  getBestEquip(ship, taisenEquips) {
    let oritaisen = ship[2];
    let slotnum = ship[3];
    let needEquipTaisen = MaxAntiSub - oritaisen;
    let ret = [];
    let can = 1;
    if (needEquipTaisen >= slotnum * 12 - 4) {
      if (needEquipTaisen > slotnum * 12 - 2) {
        if (slotnum == 3) {
          ret = [4, 4, 4];
          if (taisenEquips[4] < 3) {
            can = 0;
          }
        } else {
          ret = [4, 4, 4, 4];
          if (taisenEquips[4] < 4) {
            can = 0;
          }
        }
      } else {
        if (slotnum == 3) {
          ret = [3, 4, 4];
          if (taisenEquips[4] < 2) {
            can = 0;
          }
        } else {
          ret = [3, 4, 4, 4];
          if (taisenEquips[4] < 3) {
            can = 0;
          }
        }
      }
    } else {
      let needYtaisen = needEquipTaisen - 8;
      let Yslotnum = slotnum - 1;
      if (slotnum == 3) {
        if (needYtaisen <= 6 * Yslotnum - 3) {
          ret = [0, 2, 2];
        } else if (needYtaisen <= 6 * Yslotnum) {
          ret = [1, 2, 2];
        } else if (needYtaisen <= 6 * Yslotnum + 4) {
          ret = [1, 2, 3];
        } else if (needYtaisen <= 6 * Yslotnum + 6) {
          ret = [1, 1, 3];
        } else if (needYtaisen <= 6 * Yslotnum + 8) {
          ret = [1, 3, 3];
        } else if (needYtaisen <= 6 * Yslotnum + 10) {
          if (taisenEquips[4] >= 1) {
            ret = [1, 3, 4];
          } else {
            if (taisenEquips[3] <= 2) {
              can = 0;
            }
            ret = [3, 3, 3];
          }

        } else if (needYtaisen <= 6 * Yslotnum + 12) {
          ret = [3, 3, 4];
          if (taisenEquips[4] < 1) {
            can = 0;
          }
        } else if (needYtaisen <= 6 * Yslotnum + 14) {
          ret = [3, 4, 4];
          if (taisenEquips[4] < 2) {
            can = 0;
          }
        }
      } else {
        if (needYtaisen <= 6 * Yslotnum - 3) {
          ret = [0, 2, 2, 2];
        } else if (needYtaisen <= 6 * Yslotnum) {
          ret = [1, 2, 2, 2];
        } else if (needYtaisen <= 6 * Yslotnum + 4) {
          ret = [1, 2, 2, 3];
        } else if (needYtaisen <= 6 * Yslotnum + 6) {
          ret = [1, 1, 2, 3];
        } else if (needYtaisen <= 6 * Yslotnum + 8) {
          ret = [1, 2, 3, 3];
        } else if (needYtaisen <= 6 * Yslotnum + 10) {
          ret = [1, 1, 3, 3];
        } else if (needYtaisen <= 6 * Yslotnum + 12) {
          ret = [1, 3, 3, 3];
        } else if (needYtaisen <= 6 * Yslotnum + 14) {
          if (taisenEquips[4] >= 1 && taisenEquips[3]>=2) {
            ret = [1, 3, 3, 4];
          } else {
            if (taisenEquips[3] <= 3) {
              can = 0;
            }
            ret = [3, 3, 3, 3];
          }
        } else if (needYtaisen <= 6 * Yslotnum + 16) {
          ret = [1, 3, 4, 4];
          if (taisenEquips[4] < 2) {
            can = 0;
          }
        } else if (needYtaisen <= 6 * Yslotnum + 18) {
          ret = [1, 4, 4, 4];
          if (taisenEquips[4] < 3) {
            can = 0;
          }
        }
      }
    }
    return [ret, can];
  }


  render() {
    const taiseninfo = this.getAllTaiSenShip();
    const fleetmap = taiseninfo[0];
    const alltaisenships = taiseninfo[1];
    const taisenEquips = taiseninfo[2];
    console.log(taisenEquips);
    let shiptypes = ["駆逐艦", "軽巡洋艦", "重雷装巡洋艦", "練習巡洋艦"];
    let list = [];

    this.loadstate();
    console.log(111);
    this.setstate();
    console.log(333);
    this.loadstate();

    const drawEquip = (ret) => {
      let hret = [];
      for (let i = 0; i < ret.length; i++) {
        if (ret[i] == 0) {
          hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/117.png"></img><span className="badge badge-small">九四</span></span>)
        } else if (ret[i] == 1) {
          hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/117.png"></img><span className="badge badge-small">三式</span></span>)
        } else if (ret[i] == 2) {
          hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img><span className="badge badge-small">九三</span></span>)
        } else if (ret[i] == 3) {
          hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img><span className="badge badge-small">三式</span></span>)
        } else if (ret[i] == 4) {
          hret.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img><span className="badge badge-small">四式</span></span>)
        }
      }
      return hret;
    };

    const calcEquip = (init, ret) => {
      return ret.reduce((pre, cur) => {
        switch (cur){
          case 0: return pre + 5;
          case 1: return pre + 8;
          case 2: return pre + 6;
          case 3: return pre + 10;
          case 4: return pre + 12;
        }
      }, init);
    };

    shiptypes.map((shiptype) => {
      let shipList = alltaisenships[shiptype];
      if (shipList) {
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
            <ListGroupItem className={ship[5] ? "" : "disabled"}>
              <Row>
                <OverlayTrigger placement={this.props.horizontal == 'horizontal' ? 'top' : 'right'} overlay={<Tooltip id="tooltip">对潜值：{ship[2]}, 装备后对潜值：{calcEquip(ship[2], ship[4])}</Tooltip>}>
                  <Col xs={4}>
                      lv.{ship[1]}{ship[0]}
                  </Col>
                </OverlayTrigger>
                <Col xs={8}>
                  {drawEquip(ship[4])}
                </Col>
              </Row>
            </ListGroupItem>
          )
        })
      }
    });
    let eqlist = [];
    if (taisenEquips[0] > 0) {
      eqlist.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/117.png"></img>九四<span className="badge">{taisenEquips[0]}</span></span>)
    }
    if (taisenEquips[1] > 0) {
      eqlist.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/117.png"></img>三式<span className="badge">{taisenEquips[1]}</span></span>)
    }
    if (taisenEquips[2] > 0) {
      eqlist.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img>九三<span className="badge">{taisenEquips[2]}</span></span>)
    }
    if (taisenEquips[3] > 0) {
      eqlist.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img>三式<span className="badge">{taisenEquips[3]}</span></span>)
    }
    if (taisenEquips[4] > 0) {
      eqlist.push(<span><img style={{width:"20px"}} src="assets/img/slotitem/118.png"></img>四式<span className="badge">{taisenEquips[4]}</span></span>)
    }
    return (
      <div id="antisub" className="antisub">
        <link rel="stylesheet" href={join(__dirname, 'antisub.css')}/>
        <div className="equip-count">
          {eqlist}
        </div>
        <ListGroup>
          <ListGroupItem>
            <Row>
              <Col xs={4}>
                { "舰娘" }
              </Col>
              <Col xs={8}>
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