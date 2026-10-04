import 'dart:async';

import 'package:flutter/material.dart';

void main() {
  runApp(const OceanRescueApp());
}

class OceanRescueApp extends StatelessWidget {
  const OceanRescueApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ocean Rescue Drone System',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF1D8EFF),
        scaffoldBackgroundColor: const Color(0xFF051D33),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2EC7FF),
          brightness: Brightness.dark,
          primary: const Color(0xFF1D8EFF),
          secondary: const Color(0xFF6CE5FF),
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
          bodyMedium: TextStyle(fontSize: 16, color: Color(0xFFB7D5F0)),
          bodySmall: TextStyle(fontSize: 14, color: Color(0xFF94B9D8)),
        ),
      ),
      home: const DashboardPage(),
    );
  }
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  String missionStatus = 'Monitoring';
  String alertText = 'No active alerts. All drones are operating normally.';
  Color alertColor = const Color(0xFF2BF2A8);
  String lastUpdate = '--:--:--';
  Timer? _simulationTimer;

  final List<Drone> drones = [
    Drone(id: 'OR-01', status: 'Idle', battery: 94, location: 'Bay Alpha', eta: 'N/A'),
    Drone(id: 'OR-02', status: 'Patrolling', battery: 78, location: 'Coastal Sector 3', eta: '12 min'),
    Drone(id: 'OR-03', status: 'Responding', battery: 62, location: 'Distress signal', eta: '4 min'),
  ];

  void _updateTimestamp() {
    lastUpdate = TimeOfDay.now().format(context);
  }

  void _launchDrone() {
    setState(() {
      drones[0] = drones[0].copyWith(status: 'Launching', battery: 90, location: 'Patrol route', eta: '6 min');
      missionStatus = 'Launching';
      alertText = 'Launching additional drone to support the coastal patrol.';
      alertColor = const Color(0xFFFFB86C);
      _updateTimestamp();
    });
  }

  void _resetSimulation() {
    setState(() {
      drones[0] = drones[0].copyWith(status: 'Idle', battery: 94, location: 'Bay Alpha', eta: 'N/A');
      drones[1] = drones[1].copyWith(status: 'Patrolling', battery: 78, location: 'Coastal Sector 3', eta: '12 min');
      drones[2] = drones[2].copyWith(status: 'Responding', battery: 62, location: 'Distress signal', eta: '4 min');
      missionStatus = 'Monitoring';
      alertText = 'No active alerts. All drones are operating normally.';
      alertColor = const Color(0xFF2BF2A8);
      _updateTimestamp();
    });
  }

  void _sendEmergency() {
    setState(() {
      missionStatus = 'Emergency';
      alertText = 'Emergency alert received. Rescue drones are being dispatched to the reported location.';
      alertColor = const Color(0xFFFF6D78);
      _updateTimestamp();
    });
  }

  void _simulateMissionUpdate() {
    if (!mounted) return;
    setState(() {
      drones[0] = drones[0].copyWith(status: 'Patrolling', battery: 82, location: 'Offshore Sector 1', eta: 'N/A');
      drones[1] = drones[1].copyWith(status: 'Responding', battery: 59, location: 'Distress signal', eta: '6 min');
      drones[2] = drones[2].copyWith(status: 'Patrolling', battery: 88, location: 'Bay Alpha', eta: 'N/A');
      missionStatus = 'Active';
      alertText = 'Rescue mission underway: OR-02 is responding to an active distress signal.';
      alertColor = const Color(0xFFFF6D78);
      _updateTimestamp();
    });
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(_updateTimestamp);
    });
    _simulationTimer = Timer.periodic(const Duration(seconds: 18), (_) => _simulateMissionUpdate());
  }

  @override
  void dispose() {
    _simulationTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: OceanBackground()),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth >= 820;
                final horizontalPadding = isWide ? 24.0 : 16.0;

                return SingleChildScrollView(
                  padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 18),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1180),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          HeaderSection(onEmergency: _sendEmergency, isWide: isWide),
                          const SizedBox(height: 20),
                          if (isWide)
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(flex: 7, child: MissionSummaryCard(status: missionStatus, lastUpdate: lastUpdate)),
                                const SizedBox(width: 18),
                                const Expanded(flex: 5, child: MissionMapCard()),
                              ],
                            )
                          else ...[
                            MissionSummaryCard(status: missionStatus, lastUpdate: lastUpdate),
                            const SizedBox(height: 16),
                            const MissionMapCard(),
                          ],
                          const SizedBox(height: 18),
                          if (isWide)
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(flex: 7, child: DroneFleetCard(drones: drones)),
                                const SizedBox(width: 18),
                                Expanded(flex: 5, child: AlertCard(text: alertText, color: alertColor)),
                              ],
                            )
                          else ...[
                            DroneFleetCard(drones: drones),
                            const SizedBox(height: 16),
                            AlertCard(text: alertText, color: alertColor),
                          ],
                          const SizedBox(height: 18),
                          ActionButtons(onLaunch: _launchDrone, onReset: _resetSimulation, isWide: isWide),
                          const SizedBox(height: 22),
                          InfoPanel(isWide: isWide),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class HeaderSection extends StatelessWidget {
  final VoidCallback onEmergency;
  final bool isWide;
  const HeaderSection({super.key, required this.onEmergency, required this.isWide});

  @override
  Widget build(BuildContext context) {
    final titleBlock = Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        AppLogo(compact: !isWide),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ocean Rescue Drone System',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: isWide ? 28 : 24),
                ),
                const SizedBox(height: 6),
                Text('Real-time maritime search and rescue coordination.', style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
        ),
      ],
    );

    final emergencyButton = ElevatedButton.icon(
      onPressed: onEmergency,
      icon: const Icon(Icons.support_agent_rounded),
      label: const Text('Emergency Request'),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF1D8EFF),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    );

    if (!isWide) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          titleBlock,
          const SizedBox(height: 16),
          emergencyButton,
        ],
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: titleBlock),
        const SizedBox(width: 16),
        emergencyButton,
      ],
    );
  }
}

class AppLogo extends StatelessWidget {
  final bool compact;
  const AppLogo({super.key, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final size = compact ? 58.0 : 72.0;
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4DD8FF), Color(0xFF1D8EFF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(compact ? 18 : 22),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.22), blurRadius: 18, offset: const Offset(0, 10)),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            top: compact ? 13 : 16,
            left: compact ? 13 : 16,
            right: compact ? 13 : 16,
            child: Container(
              height: 10,
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.25), borderRadius: BorderRadius.circular(10)),
            ),
          ),
          Positioned(
            bottom: compact ? 16 : 20,
            left: compact ? 12 : 14,
            right: compact ? 12 : 14,
            child: Container(
              height: 10,
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.flight_takeoff_rounded, color: Colors.white, size: 28),
              SizedBox(height: 4),
              Text('OR', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
            ],
          ),
        ],
      ),
    );
  }
}

class MissionSummaryCard extends StatelessWidget {
  final String status;
  final String lastUpdate;
  const MissionSummaryCard({super.key, required this.status, required this.lastUpdate});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF042A4D).withOpacity(0.92),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Active Mission', style: Theme.of(context).textTheme.titleLarge),
              StatusBadge(status: status),
            ],
          ),
          const SizedBox(height: 18),
          Text('Operation: Coastal rescue patrol', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 8),
          Text('Target area: Bay zone Alpha', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 8),
          Text('Last update: $lastUpdate', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final Color background;
    final Color textColor;

    switch (status) {
      case 'Emergency':
        background = const Color(0xFFFF6D78).withOpacity(0.2);
        textColor = const Color(0xFFFF6D78);
        break;
      case 'Active':
        background = const Color(0xFFFFB86C).withOpacity(0.2);
        textColor = const Color(0xFFFFB86C);
        break;
      default:
        background = const Color(0xFF2BF2A8).withOpacity(0.18);
        textColor = const Color(0xFF2BF2A8);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)),
      child: Text(status, style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
    );
  }
}

class PanelContainer extends StatelessWidget {
  final Widget child;
  const PanelContainer({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF042A4D).withOpacity(0.92),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: child,
    );
  }
}

class MissionMapCard extends StatelessWidget {
  const MissionMapCard({super.key});

  @override
  Widget build(BuildContext context) {
    return PanelContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Mission Map', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          AspectRatio(
            aspectRatio: 1.35,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF061A2D),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: CustomPaint(
                painter: MapPainter(),
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.location_on_rounded, color: Color(0xFFFF6D78), size: 44),
                      SizedBox(height: 10),
                      MapLabel(),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Coastal zone Alpha is ready for live GPS, maps, or a backend telemetry feed.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class MapLabel extends StatelessWidget {
  const MapLabel({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: const Color(0xFF02182C).withOpacity(0.92),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: const Text('Coastal zone Alpha', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
    );
  }
}

class MapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final background = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF0D3459), Color(0xFF03101E)],
      ).createShader(Offset.zero & size);
    canvas.drawRRect(RRect.fromRectAndRadius(Offset.zero & size, const Radius.circular(18)), background);

    final gridPaint = Paint()
      ..color = Colors.white.withOpacity(0.06)
      ..strokeWidth = 1;
    for (double x = size.width / 5; x < size.width; x += size.width / 5) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = size.height / 4; y < size.height; y += size.height / 4) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final routePaint = Paint()
      ..color = const Color(0xFF6CE5FF).withOpacity(0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    final route = Path()
      ..moveTo(size.width * 0.15, size.height * 0.72)
      ..quadraticBezierTo(size.width * 0.44, size.height * 0.28, size.width * 0.78, size.height * 0.48);
    canvas.drawPath(route, routePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class DroneFleetCard extends StatelessWidget {
  final List<Drone> drones;
  const DroneFleetCard({super.key, required this.drones});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF042A4D).withOpacity(0.92),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Drone Fleet Status', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          ...drones.map((drone) => DroneListItem(drone: drone)).toList(),
        ],
      ),
    );
  }
}

class DroneListItem extends StatelessWidget {
  final Drone drone;
  const DroneListItem({super.key, required this.drone});

  @override
  Widget build(BuildContext context) {
    final Color statusColor;
    switch (drone.status) {
      case 'Responding':
        statusColor = const Color(0xFFFF6D78);
        break;
      case 'Idle':
        statusColor = const Color(0xFFFFB86C);
        break;
      default:
        statusColor = const Color(0xFF2BF2A8);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(drone.id, style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 4),
                Text(drone.location, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(drone.status, style: TextStyle(color: statusColor, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text('${drone.battery}% - ${drone.eta}', style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ],
      ),
    );
  }
}

class AlertCard extends StatelessWidget {
  final String text;
  final Color color;
  const AlertCard({super.key, required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF042A4D).withOpacity(0.92),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Live Alerts', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: color.withOpacity(0.18),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class ActionButtons extends StatelessWidget {
  final VoidCallback onLaunch;
  final VoidCallback onReset;
  final bool isWide;
  const ActionButtons({super.key, required this.onLaunch, required this.onReset, required this.isWide});

  @override
  Widget build(BuildContext context) {
    final launchButton = ElevatedButton.icon(
      onPressed: onLaunch,
      icon: const Icon(Icons.rocket_launch_rounded),
      label: const Text('Launch Drone'),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF1D8EFF),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 18),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
      ),
    );

    final resetButton = OutlinedButton.icon(
      onPressed: onReset,
      icon: const Icon(Icons.restart_alt_rounded),
      label: const Text('Reset Simulation'),
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: Colors.white24),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 18),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        foregroundColor: Colors.white,
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
      ),
    );

    if (!isWide) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          launchButton,
          const SizedBox(height: 12),
          resetButton,
        ],
      );
    }

    return Row(
      children: [
        Expanded(child: launchButton),
        const SizedBox(width: 14),
        Expanded(child: resetButton),
      ],
    );
  }
}

class InfoPanel extends StatelessWidget {
  final bool isWide;
  const InfoPanel({super.key, required this.isWide});

  @override
  Widget build(BuildContext context) {
    const tiles = [
      InfoTile(title: 'How it works', description: 'Manage rescue missions, monitor drone telemetry, and dispatch support when distress signals arrive from the water.'),
      InfoTile(title: 'Next step', description: 'Integrate live GPS, emergency request forms, and a backend API for real mission coordination.'),
      InfoTile(title: 'Development', description: 'Use this app as a starting point for the ocean rescue drone dashboard, then add authentication, mapping, and device telemetry.'),
    ];

    if (!isWide) {
      return Column(
        children: [
          for (final tile in tiles) ...[
            tile,
            if (tile != tiles.last) const SizedBox(height: 14),
          ],
        ],
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final tile in tiles) ...[
          Expanded(child: tile),
          if (tile != tiles.last) const SizedBox(width: 14),
        ],
      ],
    );
  }
}

class InfoTile extends StatelessWidget {
  final String title;
  final String description;
  const InfoTile({super.key, required this.title, required this.description});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF042A4D).withOpacity(0.92),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Text(description, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class OceanBackground extends StatelessWidget {
  const OceanBackground({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: OceanPainter(),
      child: Container(),
    );
  }
}

class OceanPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final gradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [const Color(0xFF05294E), const Color(0xFF021626)],
    );
    final paint = Paint()
      ..shader = gradient.createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);

    final wavePaint = Paint()..color = const Color(0xFF1D8EFF).withOpacity(0.16);
    final path = Path()
      ..moveTo(0, size.height * 0.65)
      ..quadraticBezierTo(size.width * 0.25, size.height * 0.72, size.width * 0.5, size.height * 0.65)
      ..quadraticBezierTo(size.width * 0.75, size.height * 0.58, size.width, size.height * 0.65)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path, wavePaint);

    final bubblePaint = Paint()..color = const Color(0xFF6CE5FF).withOpacity(0.16);
    canvas.drawCircle(Offset(size.width * 0.8, size.height * 0.18), 52, bubblePaint);
    canvas.drawCircle(Offset(size.width * 0.18, size.height * 0.15), 40, bubblePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class Drone {
  final String id;
  final String status;
  final int battery;
  final String location;
  final String eta;

  const Drone({required this.id, required this.status, required this.battery, required this.location, required this.eta});

  Drone copyWith({String? status, int? battery, String? location, String? eta}) {
    return Drone(
      id: id,
      status: status ?? this.status,
      battery: battery ?? this.battery,
      location: location ?? this.location,
      eta: eta ?? this.eta,
    );
  }
}
