let inputExpectedUnit: UnitSymbol = Units.mono;
let inputExpectedPlayer: string | undefined = undefined;
let inputInterval: number = 0.1;

function Flush() {
    const building = getBuilding("message1");
    printFlush(building);
}

function PrintAndFlush(message: string) {
    print(message);
    Flush();
}

function CheckSwitch(): boolean {
    const switchBuilding = getBuilding("switch1");
    return switchBuilding.enabled;
}

function SwitchOff() {
    const switchBuilding = getBuilding("switch1");
    control.enabled(switchBuilding, false);
}

function FindPlayer(name: string | undefined, interval: number): AnyUnit | undefined {
    PrintAndFlush("MdtMonoFollow\n\nFinding Player...");
    for (; ;) {
        if (!CheckSwitch())
            return undefined;
        const player = radar({
            building: Vars.this,
            filters: ["player", "any", "any"],
            order: true,
            sort: "distance"
        });
        if (player !== undefined) {
            if (name === undefined || player.name === name) {
                return player;
            }
        }
        wait(interval);
    }
}

function EnsureUnit(unitType: UnitSymbol, interval: number): AnyUnit | undefined {
    let unit = Vars.unit;
    if (unit !== undefined)
        return unit;

    PrintAndFlush("MdtMonoFollow\n\nFinding Unit...");
    for (; ;) {
        if (!CheckSwitch())
            return undefined;

        unitBind(unitType);

        unit = Vars.unit;
        if (unit !== undefined)
            return unit;

        wait(interval);
    }
}

let player: AnyUnit | undefined = undefined;
for (; ;) {
    if (!CheckSwitch()) {
        player = undefined;
        PrintAndFlush("MdtMonoFollow\n\nClosed.");
        wait(inputInterval);
        continue;
    }

    if (player === undefined)
        player = FindPlayer(inputExpectedPlayer, inputInterval);

    // 这里判断 player.name === undefined 是因为
    // 玩家附身后 player 变量会指向被附身的那个东西，
    // 但解除附身后 player 仍然指向那个不会变回来。
    // 这时候可以通过判断 name 来知道附身解除了，
    // 但也得重新找玩家，
    // 这里就当成玩家死了，停止运行。
    if (player === undefined ||
        player.dead ||
        player.name === undefined) {
        SwitchOff();
        continue;
    }

    const unit = EnsureUnit(inputExpectedUnit, inputInterval);
    if (unit === undefined)
        continue;

    print("MdtMonoFollow\n\n");
    print("Player:\n");
    print(player.name);
    print("\nUnit: \n(");
    print(Math.floor(unit.x));
    print(", ");
    print(Math.floor(unit.y));
    print(")");
    Flush();

    if (unit !== Vars.unit)
        continue;
    unitControl.approach({
        x: player.x,
        y: player.y,
        radius: 3
    });
}
