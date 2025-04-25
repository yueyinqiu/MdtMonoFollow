let inputExpectedUnit: UnitSymbol = Units.mono;
let inputExpectedPlayer: string | undefined = undefined;
let inputInterval: number = 0.5;

function Flush() {
    const building = getBuilding("message1");
    printFlush(building);
}

function PrintAndFlush(message: string)
{
    print(message);
    Flush();
}

function FindPlayer(name: string | undefined, interval: number): AnyUnit {
    PrintAndFlush("Finding Player...");
    for (; ;) {
        const player = radar({
            building: Vars.this,
            filters: ["player", "any", "any"],
            order: true,
            sort: "distance"
        });
        if (player !== undefined)
        {
            if (name === undefined || player.name === name)
            {
                return player;
            }
        }
        wait(interval);
    }
}

function EnsureUnit(unitType: UnitSymbol, interval: number): AnyUnit {
    let unit = Vars.unit;
    if (unit !== undefined)
        return unit;

    PrintAndFlush("Binding Unit...");
    for (; ;) {
        unitBind(unitType);

        unit = Vars.unit;
        if (unit !== undefined)
            return unit;

        wait(interval);
    }
}

let player: AnyUnit | undefined = undefined;
const switchBuilding = getBuilding("switch1");
for (; ;)
{
    if (!switchBuilding.enabled)
    {
        player = undefined;
        PrintAndFlush("Closed.")
        wait(0.5);
        continue;
    }

    if (player === undefined || player.dead)
        player = FindPlayer(inputExpectedPlayer, inputInterval);
    const unit = EnsureUnit(inputExpectedUnit, inputInterval);

    print("Working...\n\n");
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
    wait(inputInterval);
}
