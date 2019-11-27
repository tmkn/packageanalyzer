//console.log(`Hello World`);

interface ITree {
    value: string;
    left: ITree | null;
    right: ITree | null;
}

const C0: ITree = {
    value: "C0",
    left: null,
    right: null
}

const C1: ITree = {
    value: "C1",
    left: null,
    right: null
}

const C2: ITree = {
    value: "C2",
    left: null,
    right: null
}

const C3: ITree = {
    value: "C3",
    left: null,
    right: null
}

const B0: ITree = {
    value: "B0",
    left: C0,
    right: C1
}

const B1: ITree = {
    value: "B1",
    left: C2,
    right: C3
}

const A0: ITree = {
    value: "A0",
    left: B0,
    right: B1
}

function bfs(queue: ITree[]): void {
    const newLevel: ITree[] = [];

    while(queue.length !== 0) {
        const current = queue.shift();

        if(current) {
            console.log(current.value);

            if(current.left)
                newLevel.push(current.left);
            if(current.right)
                newLevel.push(current.right);
        }
    }

    if(newLevel.length > 0)
        bfs(newLevel);
}

bfs([A0]);