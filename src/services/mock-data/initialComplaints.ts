import { Complaint } from '../../types';

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'CMP-1001',
    title: 'High-speed Wi-Fi router dropouts in Central Library 3rd Floor',
    description: 'The Wi-Fi access point near the silent study desks continuously drops connection every 5-10 minutes. More than 40 students studying for midterms are facing issues with digital journal access.',
    category: 'IT and Wi-Fi',
    priority: 'High',
    status: 'In Progress',
    location: 'Central Library, 3rd Floor, West Wing',
    department: 'IT Services',
    studentId: 'usr-student-01',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@campus.edu',
    studentDepartment: 'Computer Science & Engineering',
    createdAt: '2026-10-18T09:30:00.000Z',
    updatedAt: '2026-10-19T14:20:00.000Z',
    assignedTo: 'Prof. David Miller (IT Services)',
    adminRemarks: 'Network team diagnosed firmware crash on Cisco AP-302. Replacement hardware ordered and scheduled for installation tomorrow morning.',
    statusHistory: [
      {
        id: 'hist-1001-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-18T09:30:00.000Z',
        actor: { id: 'usr-student-01', name: 'Rohan Sharma', role: 'student' }
      },
      {
        id: 'hist-1001-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-18T11:45:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Assigned to IT Network Infrastructure team for urgent survey.'
      },
      {
        id: 'hist-1001-3',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        timestamp: '2026-10-19T14:20:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Network engineer deployed on site to test channel interference.'
      }
    ]
  },
  {
    id: 'CMP-1002',
    title: 'Faulty digital oscilloscope in Electronics Lab B',
    description: 'Bench 4 digital storage oscilloscope (Rigol DS1054Z) power supply trips the bench circuit breaker upon activation. Suspected short circuit in the internal transformer.',
    category: 'Laboratory Equipment',
    priority: 'Critical',
    status: 'Assigned',
    location: 'Engineering Block 2, Lab 204 (Bench 4)',
    department: 'Classroom Support',
    studentId: 'usr-student-01',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@campus.edu',
    studentDepartment: 'Computer Science & Engineering',
    createdAt: '2026-10-20T10:15:00.000Z',
    updatedAt: '2026-10-20T16:00:00.000Z',
    assignedTo: 'Dr. Anita Roy (Lab In-Charge)',
    adminRemarks: 'Bench has been isolated and safety tags applied. Lab technician requested warranty repair.',
    statusHistory: [
      {
        id: 'hist-1002-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-20T10:15:00.000Z',
        actor: { id: 'usr-student-01', name: 'Rohan Sharma', role: 'student' }
      },
      {
        id: 'hist-1002-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-20T16:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Critical flag verified. Safety lockout protocol initiated with Lab Support.'
      }
    ]
  },
  {
    id: 'CMP-1003',
    title: 'Ceiling water leakage near Lecture Theatre 4 projector',
    description: 'Heavy rain caused water seepage from the ceiling directly above the ceiling-mounted laser projector. Water is dripping onto row 3 desks.',
    category: 'Classroom Facilities',
    priority: 'Critical',
    status: 'Resolved',
    location: 'Academic Complex 1, LT-4',
    department: 'Campus Maintenance',
    studentId: 'usr-student-01',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@campus.edu',
    studentDepartment: 'Computer Science & Engineering',
    createdAt: '2026-10-12T08:00:00.000Z',
    updatedAt: '2026-10-14T17:30:00.000Z',
    resolvedAt: '2026-10-14T17:30:00.000Z',
    assignedTo: 'Eng. Sarah Jenkins (Estate Office)',
    adminRemarks: 'Rooftop membrane sealant reapplied and drainage pipe unblocked. Projector housing inspected and certified safe.',
    statusHistory: [
      {
        id: 'hist-1003-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-12T08:00:00.000Z',
        actor: { id: 'usr-student-01', name: 'Rohan Sharma', role: 'student' }
      },
      {
        id: 'hist-1003-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-12T09:15:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Escalated immediately to Maintenance Estate team due to risk to AV electronics.'
      },
      {
        id: 'hist-1003-3',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        timestamp: '2026-10-12T13:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Roofing crew on site repairing the outer flashing.'
      },
      {
        id: 'hist-1003-4',
        previousStatus: 'In Progress',
        newStatus: 'Resolved',
        timestamp: '2026-10-14T17:30:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Waterproofing test completed successfully under pressurized spray. No leaks observed.'
      }
    ]
  },
  {
    id: 'CMP-1004',
    title: 'Duplicate fee charge reflection on Student Portal statement',
    description: 'Semester 5 Lab Amenities fee ($120) appears twice on my tuition summary after the payment gateway timed out on Oct 10.',
    category: 'Fees and Accounts',
    priority: 'Medium',
    status: 'In Progress',
    location: 'Student Portal / Finance Bureau',
    department: 'Finance & Accounts',
    studentId: 'usr-student-01',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@campus.edu',
    studentDepartment: 'Computer Science & Engineering',
    createdAt: '2026-10-15T11:00:00.000Z',
    updatedAt: '2026-10-17T15:45:00.000Z',
    assignedTo: 'Sanjay Deshmukh (Accounts Officer)',
    adminRemarks: 'Bank transaction reconciliation underway. Duplicate authorization code identified.',
    statusHistory: [
      {
        id: 'hist-1004-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-15T11:00:00.000Z',
        actor: { id: 'usr-student-01', name: 'Rohan Sharma', role: 'student' }
      },
      {
        id: 'hist-1004-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-16T10:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Forwarded to Accounts Bursar for ledger verification.'
      },
      {
        id: 'hist-1004-3',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        timestamp: '2026-10-17T15:45:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Gateway refund reference #REF-9921 generated. Crediting within 3-5 business days.'
      }
    ]
  },
  {
    id: 'CMP-1005',
    title: 'Corridor emergency lighting battery backup failure in Hostel Block C',
    description: 'During yesterday brief outage, emergency exit lamps on 2nd floor failed to illuminate. Both indicator LEDs are blinking red.',
    category: 'Electrical Maintenance',
    priority: 'High',
    status: 'Submitted',
    location: 'Hostel Block C, 2nd Floor Corridor',
    department: 'Electrical Works',
    studentId: 'usr-student-01',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@campus.edu',
    studentDepartment: 'Computer Science & Engineering',
    createdAt: '2026-10-21T18:40:00.000Z',
    updatedAt: '2026-10-21T18:40:00.000Z',
    statusHistory: [
      {
        id: 'hist-1005-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-21T18:40:00.000Z',
        actor: { id: 'usr-student-01', name: 'Rohan Sharma', role: 'student' }
      }
    ]
  },
  {
    id: 'CMP-1006',
    title: 'Request for personal gaming console port forwarding in dorms',
    description: 'Requesting IT department open ports 3074 and 27015 on the campus firewall to reduce latency for online console gaming.',
    category: 'IT and Wi-Fi',
    priority: 'Low',
    status: 'Rejected',
    location: 'Hostel Block B, Room 304',
    department: 'IT Services',
    studentId: 'usr-student-01',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@campus.edu',
    studentDepartment: 'Computer Science & Engineering',
    createdAt: '2026-10-10T14:00:00.000Z',
    updatedAt: '2026-10-11T11:20:00.000Z',
    adminRemarks: 'Per Campus IT Security Policy Section 4.2, outbound and inbound arbitrary port opening for personal entertainment devices is strictly prohibited to safeguard network perimeter integrity.',
    statusHistory: [
      {
        id: 'hist-1006-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-10T14:00:00.000Z',
        actor: { id: 'usr-student-01', name: 'Rohan Sharma', role: 'student' }
      },
      {
        id: 'hist-1006-2',
        previousStatus: 'Submitted',
        newStatus: 'Rejected',
        timestamp: '2026-10-11T11:20:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Violates campus cybersecurity compliance guidelines.'
      }
    ]
  },
  {
    id: 'CMP-1007',
    title: 'Drinking water cooler filtration indicator red in Science Block',
    description: 'The AquaGuard UV cooler on the 1st floor opposite Chemistry Lab 1 has been displaying the red filter replacement indicator for 4 days.',
    category: 'Sanitation',
    priority: 'Medium',
    status: 'Resolved',
    location: 'Science Complex, 1st Floor East',
    department: 'Sanitation & Health',
    studentId: 'usr-student-02',
    studentName: 'Priya Patel',
    studentEmail: 'priya.patel@campus.edu',
    studentDepartment: 'Electrical Engineering',
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-13T16:00:00.000Z',
    resolvedAt: '2026-10-13T16:00:00.000Z',
    assignedTo: 'Mohan Lal (Sanitation Supervisor)',
    adminRemarks: 'Multi-stage sediment and carbon cartridges replaced. TDS level calibrated to 110 ppm.',
    statusHistory: [
      {
        id: 'hist-1007-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-11T10:00:00.000Z',
        actor: { id: 'usr-student-02', name: 'Priya Patel', role: 'student' }
      },
      {
        id: 'hist-1007-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-12T08:30:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      },
      {
        id: 'hist-1007-3',
        previousStatus: 'Assigned',
        newStatus: 'Resolved',
        timestamp: '2026-10-13T16:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Water quality certification updated on wall placard.'
      }
    ]
  },
  {
    id: 'CMP-1008',
    title: 'Broken safety guard on CNC milling machine in Workshop 3',
    description: 'The acrylic protective shield on the 3-axis CNC milling station has cracked hinges and falls off when the spindle revs up. Severe safety hazard for mechanical students.',
    category: 'Laboratory Equipment',
    priority: 'Critical',
    status: 'In Progress',
    location: 'Central Mechanical Workshop, Bay C',
    department: 'Campus Maintenance',
    studentId: 'usr-student-03',
    studentName: 'Alex Chen',
    studentEmail: 'alex.chen@campus.edu',
    studentDepartment: 'Mechanical Engineering',
    createdAt: '2026-10-19T11:20:00.000Z',
    updatedAt: '2026-10-20T09:40:00.000Z',
    assignedTo: 'Eng. Sarah Jenkins (Estate Office)',
    adminRemarks: 'Machine tagged out of service. Workshop instructor notified to halt CNC session until replacement polycarb shield is bolted.',
    statusHistory: [
      {
        id: 'hist-1008-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-19T11:20:00.000Z',
        actor: { id: 'usr-student-03', name: 'Alex Chen', role: 'student' }
      },
      {
        id: 'hist-1008-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-19T13:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      },
      {
        id: 'hist-1008-3',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        timestamp: '2026-10-20T09:40:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' },
        remark: 'Fabrication team custom-fitting a reinforced bracket.'
      }
    ]
  },
  {
    id: 'CMP-1009',
    title: 'Delay in issuing official Bonafide and Transcript certificates',
    description: 'Submitted application for passport verification bonafide certificate 14 days ago. Normal SLA is 3 business days, but no update received from student desk.',
    category: 'Administration',
    priority: 'Medium',
    status: 'Assigned',
    location: 'Administrative Building, Counter 4',
    department: 'General Administration',
    studentId: 'usr-student-04',
    studentName: 'Ananya Rao',
    studentEmail: 'ananya.rao@campus.edu',
    studentDepartment: 'Biotechnology',
    createdAt: '2026-10-17T14:30:00.000Z',
    updatedAt: '2026-10-18T10:15:00.000Z',
    assignedTo: 'Registrar Section Desk B',
    adminRemarks: 'Delay occurred due to registrar signature backlog during convocation prep. Expedited for digital issue.',
    statusHistory: [
      {
        id: 'hist-1009-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-17T14:30:00.000Z',
        actor: { id: 'usr-student-04', name: 'Ananya Rao', role: 'student' }
      },
      {
        id: 'hist-1009-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-18T10:15:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      }
    ]
  },
  {
    id: 'CMP-1010',
    title: 'HVAC Air conditioning failure in Seminar Hall 1 during guest lectures',
    description: 'Thermostat in Seminar Hall 1 is frozen at 31 degrees Celsius. Cooling compressor does not engage even when dialed down.',
    category: 'Classroom Facilities',
    priority: 'High',
    status: 'In Progress',
    location: 'Management Block, Seminar Hall 1',
    department: 'Campus Maintenance',
    studentId: 'usr-student-02',
    studentName: 'Priya Patel',
    studentEmail: 'priya.patel@campus.edu',
    studentDepartment: 'Electrical Engineering',
    createdAt: '2026-10-16T12:00:00.000Z',
    updatedAt: '2026-10-17T09:00:00.000Z',
    assignedTo: 'Eng. Sarah Jenkins (Estate Office)',
    adminRemarks: 'Refrigerant pressure checked; small valve pinhole detected. Vacuuming and gas recharging underway.',
    statusHistory: [
      {
        id: 'hist-1010-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-16T12:00:00.000Z',
        actor: { id: 'usr-student-02', name: 'Priya Patel', role: 'student' }
      },
      {
        id: 'hist-1010-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-16T14:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      },
      {
        id: 'hist-1010-3',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        timestamp: '2026-10-17T09:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      }
    ]
  },
  {
    id: 'CMP-1011',
    title: 'Trash cans overflowing near Cafeteria outdoor seating pergola',
    description: 'Recycling and compost bins by the campus courtyard have not been cleared since Friday evening. Attracting stray animals.',
    category: 'Sanitation',
    priority: 'Medium',
    status: 'Resolved',
    location: 'Student Activity Centre Courtyard',
    department: 'Sanitation & Health',
    studentId: 'usr-student-03',
    studentName: 'Alex Chen',
    studentEmail: 'alex.chen@campus.edu',
    studentDepartment: 'Mechanical Engineering',
    createdAt: '2026-10-14T09:00:00.000Z',
    updatedAt: '2026-10-14T14:30:00.000Z',
    resolvedAt: '2026-10-14T14:30:00.000Z',
    assignedTo: 'Mohan Lal (Sanitation Supervisor)',
    adminRemarks: 'Area sanitized with disinfectant spray. Additional weekend cleaning shifts scheduled for the cafeteria perimeter.',
    statusHistory: [
      {
        id: 'hist-1011-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-14T09:00:00.000Z',
        actor: { id: 'usr-student-03', name: 'Alex Chen', role: 'student' }
      },
      {
        id: 'hist-1011-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-14T10:15:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      },
      {
        id: 'hist-1011-3',
        previousStatus: 'Assigned',
        newStatus: 'Resolved',
        timestamp: '2026-10-14T14:30:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      }
    ]
  },
  {
    id: 'CMP-1012',
    title: 'Exposed electrical wires behind desk podium in Lecture Hall 201',
    description: 'Frayed wire junction box exposed near the presenter foot pedal. Poses potential electrocution hazard to lecturers and students.',
    category: 'Electrical Maintenance',
    priority: 'Critical',
    status: 'In Progress',
    location: 'Academic Complex 2, LH-201',
    department: 'Electrical Works',
    studentId: 'usr-student-04',
    studentName: 'Ananya Rao',
    studentEmail: 'ananya.rao@campus.edu',
    studentDepartment: 'Biotechnology',
    createdAt: '2026-10-21T08:15:00.000Z',
    updatedAt: '2026-10-21T11:00:00.000Z',
    assignedTo: 'Vikram Mehta (Electrical Works)',
    adminRemarks: 'Power to podium trunking isolated immediately. New heavy-duty insulated conduit being installed.',
    statusHistory: [
      {
        id: 'hist-1012-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-21T08:15:00.000Z',
        actor: { id: 'usr-student-04', name: 'Ananya Rao', role: 'student' }
      },
      {
        id: 'hist-1012-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-21T09:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      },
      {
        id: 'hist-1012-3',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        timestamp: '2026-10-21T11:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      }
    ]
  },
  {
    id: 'CMP-1013',
    title: 'Request to extend campus library opening hours to 24/7 during final exam month',
    description: 'Proposing that the ground and first floor reading rooms stay open around the clock between Nov 15 and Dec 15 with student badge access.',
    category: 'Other',
    priority: 'Low',
    status: 'Submitted',
    location: 'Central Library',
    department: 'Academic Affairs',
    studentId: 'usr-student-01',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@campus.edu',
    studentDepartment: 'Computer Science & Engineering',
    createdAt: '2026-10-21T15:00:00.000Z',
    updatedAt: '2026-10-21T15:00:00.000Z',
    statusHistory: [
      {
        id: 'hist-1013-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-21T15:00:00.000Z',
        actor: { id: 'usr-student-01', name: 'Rohan Sharma', role: 'student' }
      }
    ]
  },
  {
    id: 'CMP-1014',
    title: 'LMS course portal portal page returning HTTP 500 error on assignment upload',
    description: 'When uploading PDF submissions greater than 10MB to CS301 Algorithms portal, the application returns Internal Server Error and does not register submission timestamp.',
    category: 'IT and Wi-Fi',
    priority: 'High',
    status: 'Assigned',
    location: 'Online LMS Portal / Web Infrastructure',
    department: 'IT Services',
    studentId: 'usr-student-02',
    studentName: 'Priya Patel',
    studentEmail: 'priya.patel@campus.edu',
    studentDepartment: 'Electrical Engineering',
    createdAt: '2026-10-20T17:30:00.000Z',
    updatedAt: '2026-10-21T09:20:00.000Z',
    assignedTo: 'Prof. David Miller (IT Services)',
    adminRemarks: 'Nginx client_max_body_size setting configured too low after recent reverse proxy upgrade. Updating limit to 50MB.',
    statusHistory: [
      {
        id: 'hist-1014-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-20T17:30:00.000Z',
        actor: { id: 'usr-student-02', name: 'Priya Patel', role: 'student' }
      },
      {
        id: 'hist-1014-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-21T09:20:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      }
    ]
  },
  {
    id: 'CMP-1015',
    title: 'Centrifuge balance warning in Biochemistry research lab',
    description: 'Eppendorf Centrifuge 5810R vibrates erratically above 3000 RPM even when tubes are balanced with precision balance down to 0.01g.',
    category: 'Laboratory Equipment',
    priority: 'High',
    status: 'Resolved',
    location: 'Bio-Research Annex, Room 108',
    department: 'Classroom Support',
    studentId: 'usr-student-04',
    studentName: 'Ananya Rao',
    studentEmail: 'ananya.rao@campus.edu',
    studentDepartment: 'Biotechnology',
    createdAt: '2026-10-08T13:45:00.000Z',
    updatedAt: '2026-10-10T11:00:00.000Z',
    resolvedAt: '2026-10-10T11:00:00.000Z',
    assignedTo: 'Dr. Anita Roy (Lab In-Charge)',
    adminRemarks: 'Rotor rotor pin had carbon dust buildup and spindle alignment was off by 1.2 degrees. Service technician calibrated and rotor test passed.',
    statusHistory: [
      {
        id: 'hist-1015-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-08T13:45:00.000Z',
        actor: { id: 'usr-student-04', name: 'Ananya Rao', role: 'student' }
      },
      {
        id: 'hist-1015-2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-09T09:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      },
      {
        id: 'hist-1015-3',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
        timestamp: '2026-10-09T14:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      },
      {
        id: 'hist-1015-4',
        previousStatus: 'In Progress',
        newStatus: 'Resolved',
        timestamp: '2026-10-10T11:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      }
    ]
  },
  {
    id: 'CMP-1016',
    title: 'Discrepancy in attendance calculation for Physics Lab practicals',
    description: 'Biometric fingerprint reader was offline on Oct 3rd and manual sign-in sheet was not updated in SIS portal, marking 18 students absent.',
    category: 'Administration',
    priority: 'Low',
    status: 'Resolved',
    location: 'Physics Wing, Room 310',
    department: 'Academic Affairs',
    studentId: 'usr-student-03',
    studentName: 'Alex Chen',
    studentEmail: 'alex.chen@campus.edu',
    studentDepartment: 'Mechanical Engineering',
    createdAt: '2026-10-05T16:00:00.000Z',
    updatedAt: '2026-10-07T12:00:00.000Z',
    resolvedAt: '2026-10-07T12:00:00.000Z',
    assignedTo: 'Dr. Katherine Brooks (Dean Academics)',
    adminRemarks: 'Manual attendance log verified with lab assistant. SIS database attendance rectified for all 18 affected students.',
    statusHistory: [
      {
        id: 'hist-1016-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-05T16:00:00.000Z',
        actor: { id: 'usr-student-03', name: 'Alex Chen', role: 'student' }
      },
      {
        id: 'hist-1016-2',
        previousStatus: 'Submitted',
        newStatus: 'In Progress',
        timestamp: '2026-10-06T10:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      },
      {
        id: 'hist-1016-3',
        previousStatus: 'In Progress',
        newStatus: 'Resolved',
        timestamp: '2026-10-07T12:00:00.000Z',
        actor: { id: 'usr-admin-01', name: 'Dr. Aris Thorne', role: 'admin' }
      }
    ]
  }
];
