let inputExpectedUnit: UnitSymbol = Units.mono;
let inputExpectedPlayer: string | undefined = undefined;
let inputInterval: number = 0;

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

function FindUnit(unitType: UnitSymbol, interval: number): AnyUnit | undefined {
    PrintAndFlush("MdtMonoFollow\n\nFinding Unit...");
    for (; ; wait(interval)) {
        if (!CheckSwitch())
            return undefined;

        unitBind(unitType);
        const unit = Vars.unit;

        if (unit === undefined) {
            continue;
        }
        if (unit.controlled === ControlKind.ctrlPlayer) {
            continue;
        }
        if (unit.controlled === ControlKind.ctrlProcessor) {
            continue;
        }

        return unit;
    }
}

function Run(interval: number): string {
    const player = FindPlayer(inputExpectedPlayer, interval);
    if (player === undefined)
        return "Manually Stopped";
    const playerType = player.type;

    const unit = FindUnit(inputExpectedUnit, interval);
    if (unit === undefined)
        return "Manually Stopped";

    for (; ;) {
        if (!CheckSwitch()) {
            return "Manually Stopped";
        }

        if (player === undefined) {
            SwitchOff();
            return "Player Disappeared";
        }
        if (player.dead) {
            SwitchOff();
            return "Player Dead";
        }
        // 原本未附身，现在附身到其他东西了
        if (player.type !== playerType) {
            SwitchOff();
            return "Player Dead";
        }
        // 原本附身现在出来了（此时 player 指的是被附身的东西）
        if (player.name === undefined) {
            SwitchOff();
            return "Player Dead";
        }

        if (unit === undefined) {
            SwitchOff();
            return "Unit Disappeared";
        }
        if (unit.dead) {
            SwitchOff();
            return "Unit Dead";
        }
        if (unit !== Vars.unit) {
            SwitchOff();
            return "Unit Disappeared";
        }

        print("MdtMonoFollow\n\n");
        print("Player: ");
        print(player.name);
        print("\nUnit: (");
        print(Math.floor(unit.x));
        print(", ");
        print(Math.floor(unit.y));
        print(")");
        Flush();

        unitControl.approach({
            x: player.x,
            y: player.y,
            radius: 3
        });
        wait(interval);
    }
}

SwitchOff();
PrintAndFlush("MdtMonoFollow\n\nhttps://github.com/yueyinqiu/MdtMonoFollow");

for (; ;) {
    if (!CheckSwitch()) {
        wait(inputInterval);
        continue;
    }

    const stopReason = Run(inputInterval);
    print("MdtMonoFollow\n\nStopped. Reason: ");
    print(stopReason);
    Flush();
}
