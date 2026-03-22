import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { BusService } from './bus.service';
import { RouteService } from './route.service';
import { AlertService } from './alert.service';

// @UseGuards(JwtAuthGuard)
@Controller('core')
export class CoreController {
  constructor(
    private readonly studentService: StudentService,
    private readonly busService: BusService,
    private readonly routeService: RouteService,
    private readonly alertService: AlertService,
  ) {}

  @Get('students')
  getStudents() { return this.studentService.findAll(); }

  @Post('students')
  createStudent(@Body() data: any) { return this.studentService.create(data); }

  @Patch('students/:id')
  updateStudent(@Param('id') id: string, @Body() data: any) { return this.studentService.update(id, data); }

  @Delete('students/:id')
  deleteStudent(@Param('id') id: string) { return this.studentService.delete(id); }

  @Get('buses')
  getBuses() { return this.busService.findAll(); }

  @Post('buses')
  createBus(@Body() data: any) { return this.busService.create(data); }

  @Patch('buses/:id')
  updateBus(@Param('id') id: string, @Body() data: any) { return this.busService.update(id, data); }

  @Delete('buses/:id')
  deleteBus(@Param('id') id: string) { return this.busService.delete(id); }

  @Get('routes')
  getRoutes() { return this.routeService.findAll(); }

  @Post('routes')
  createRoute(@Body() data: any) { return this.routeService.create(data); }

  @Patch('routes/:id')
  updateRoute(@Param('id') id: string, @Body() data: any) { return this.routeService.update(id, data); }

  @Delete('routes/:id')
  deleteRoute(@Param('id') id: string) { return this.routeService.delete(id); }

  // ── Alerts (SOS) ──────────────────────────────────────────────────────
  @Post('alerts')
  createAlert(@Body() body: { message: string }) {
    return this.alertService.create(body.message);
  }

  @Get('alerts')
  getAlerts(@Query('resolved') resolved?: string) {
    if (resolved === 'true') return this.alertService.findAll(true);
    if (resolved === 'false') return this.alertService.findAll(false);
    return this.alertService.findAll();
  }

  @Patch('alerts/:id/resolve')
  resolveAlert(@Param('id') id: string) {
    return this.alertService.resolve(id);
  }
}
