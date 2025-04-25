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

function EnsureUnit(unitType: UnitSymbol, interval: number): AnyUnit | undefined {
    let unit = Vars.unit;
    if (unit !== undefined) {
        if (unit.controlled !== ControlKind.ctrlPlayer) {
            return unit;
        }
    }

    PrintAndFlush("MdtMonoFollow\n\nFinding Unit...");
    for (; ;) {
        if (!CheckSwitch())
            return undefined;

        unitBind(unitType);

        unit = Vars.unit;
        if (unit !== undefined) {
            if (unit.controlled !== ControlKind.ctrlPlayer) {
                return unit;
            }
        }

        wait(interval);
    }
}

function Run(interval: number): string {
    const player = FindPlayer(inputExpectedPlayer, interval);
    if (player === undefined) {
        return "Manually Stopped";
    }

    const playerType = player.type;

    for (; ;) {
        if (!CheckSwitch()) {
            return "Manually Stopped";
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

        const unit = EnsureUnit(inputExpectedUnit, interval);
        if (unit === undefined) {
            return "Manually Stopped";
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
PrintAndFlush("MdtMonoFollow\n\nStopped. Reason: Initial State");

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
