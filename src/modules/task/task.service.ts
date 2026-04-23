import { Injectable } from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { PrismaService } from "../../common/services/prisma.service";

@Injectable()
export class TaskService {

    constructor(
        private prisma: PrismaService
    ) {}

    public async getAllTasks(): Promise<any[]> {
        return await this.prisma.task.findMany();
    }

    private tasks: any[] = [];

    public getTask(): any[] {
        return this.tasks;
    }

    public getTaskById(id: number): any {
        var task = this.tasks.find ((t) => t.id === id); 
        return task;
    }

    public insert(task: CreateTaskDto): any {
        var id = this.tasks.length + 1;
        var insertedTask = this.tasks.push({
            ...task,
            id
        });
        return this.tasks[insertedTask - 1];
    }

    public update(id: number, task: any) {
        const taskUpdate = this.tasks.map(t => {
            if (t.id == id) {
                return {
                    ...t,
                    ...task
                };
            }
            return t;
        });
        return taskUpdate;
    }

    public delete(id: number): string {
       const array = this.tasks.filter(t => t.id !== id);
       this.tasks = array;
       return `Task deleted`;
    }
}
