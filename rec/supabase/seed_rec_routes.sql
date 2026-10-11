-- REC Perungudi routes. Stop names are from the REC Transport page. Arrival times are computed live in the app.
-- Coordinates are APPROXIMATE: correct them in Admin -> Stops (or edit here) for accurate map pins.
-- Safe to run on the existing schema; 
delete from buses;

insert into buses(name, route_name) values ('Route 01 - Thiruvottiyur', 'Thiruvottiyur → REC Perungudi Campus');
insert into bus_stops(bus_id, stop_name, latitude, longitude, stop_order)
select id, v.n, v.la, v.lo, v.o from buses, (values
  ('Thiruvottiyur Bus Stand',13.1589,80.3,1),
  ('Tollgate',13.146,80.29,2),
  ('Tondiarpet',13.126,80.287,3),
  ('Central Railway Station',13.0827,80.2757,4),
  ('University of Madras',13.064,80.283,5),
  ('Santhome',13.033,80.276,6),
  ('Pattinapakkam Signal',13.023,80.279,7),
  ('Adyar',13.0063,80.2574,8),
  ('Thiruvanmiyur',12.983,80.2594,9),
  ('Perungudi Campus',12.9606,80.245,10)
) as v(n,la,lo,o) where buses.name='Route 01 - Thiruvottiyur';

insert into buses(name, route_name) values ('Route 02 - Ambattur', 'Ambattur → REC Perungudi Campus');
insert into bus_stops(bus_id, stop_name, latitude, longitude, stop_order)
select id, v.n, v.la, v.lo, v.o from buses, (values
  ('Singapore Shopping',13.1143,80.1548,1),
  ('Thirumullaivoyal',13.133,80.14,2),
  ('Avadi',13.1067,80.101,3),
  ('Govardhanagiri',13.123,80.112,4),
  ('Senneerkuppam',13.06,80.095,5),
  ('Kumanachavadi',13.045,80.12,6),
  ('Mangadu',13.029,80.105,7),
  ('Kundrathur',12.998,80.098,8),
  ('Pammal',12.968,80.133,9),
  ('Pallavaram',12.9675,80.1491,10),
  ('Chrompet',12.9516,80.1462,11),
  ('Kavery Hospital',12.98,80.215,12),
  ('Perungudi Campus',12.9606,80.245,13)
) as v(n,la,lo,o) where buses.name='Route 02 - Ambattur';

insert into buses(name, route_name) values ('Route 03 - Redhills', 'Redhills → REC Perungudi Campus');
insert into bus_stops(bus_id, stop_name, latitude, longitude, stop_order)
select id, v.n, v.la, v.lo, v.o from buses, (values
  ('Redhills Bus Stand',13.19,80.187,1),
  ('Madhavaram Roundana',13.148,80.23,2),
  ('Retteri',13.125,80.23,3),
  ('Padi Bridge',13.095,80.185,4),
  ('Anna Nagar West Depot',13.09,80.2,5),
  ('Koyambedu',13.069,80.195,6),
  ('Vadapalani',13.05,80.212,7),
  ('Kodambakkam Bridge',13.051,80.225,8),
  ('T. Nagar',13.0418,80.2341,9),
  ('Saidapet',13.0213,80.2231,10),
  ('Little Mount',13.01,80.22,11),
  ('Velachery Bypass',12.99,80.22,12),
  ('Baby Nagar',12.976,80.223,13),
  ('Perungudi Campus',12.9606,80.245,14)
) as v(n,la,lo,o) where buses.name='Route 03 - Redhills';

insert into buses(name, route_name) values ('Route 04 - Poonamallee', 'Poonamallee → REC Perungudi Campus');
insert into bus_stops(bus_id, stop_name, latitude, longitude, stop_order)
select id, v.n, v.la, v.lo, v.o from buses, (values
  ('Poonamallee Bypass (Aaladipattiyan Tea Shop)',13.0475,80.11,1),
  ('Kumanachavadi',13.045,80.12,2),
  ('Kattupakkam',13.04,80.135,3),
  ('Iyyappanthangal',13.033,80.138,4),
  ('Porur',13.0382,80.1565,5),
  ('DLF',13.017,80.175,6),
  ('Ramapuram',13.03,80.18,7),
  ('Guindy',13.0067,80.2206,8),
  ('Mathiya Kailash - OMR',12.998,80.242,9),
  ('Perungudi Campus',12.9606,80.245,10)
) as v(n,la,lo,o) where buses.name='Route 04 - Poonamallee';

insert into buses(name, route_name) values ('Route 05 - Guduvanchery', 'Guduvanchery → REC Perungudi Campus');
insert into bus_stops(bus_id, stop_name, latitude, longitude, stop_order)
select id, v.n, v.la, v.lo, v.o from buses, (values
  ('Guduvanchery Bus Stand',12.845,80.06,1),
  ('Kilambakkam',12.869,80.078,2),
  ('Vandalur',12.892,80.081,3),
  ('Tambaram',12.9249,80.1,4),
  ('Sembakkam',12.91,80.14,5),
  ('Medavakkam',12.92,80.192,6),
  ('Jain College - OMR',12.9,80.227,7),
  ('Perungudi Tollgate',12.97,80.244,8),
  ('Perungudi Campus',12.9606,80.245,9)
) as v(n,la,lo,o) where buses.name='Route 05 - Guduvanchery';

insert into buses(name, route_name) values ('Route 06 - Padi', 'Padi → REC Perungudi Campus');
insert into bus_stops(bus_id, stop_name, latitude, longitude, stop_order)
select id, v.n, v.la, v.lo, v.o from buses, (values
  ('Padi Saravana Store',13.1,80.185,1),
  ('Korattur Signal',13.11,80.185,2),
  ('Ambattur Estate',13.099,80.16,3),
  ('Wavin Bus Stop',13.09,80.16,4),
  ('MGR University',13.062,80.17,5),
  ('Nerkundram Bus Stop',13.06,80.175,6),
  ('Pachaiyappa''s',13.078,80.243,7),
  ('Chetpet',13.073,80.242,8),
  ('KK Nagar',13.041,80.2,9),
  ('Kotturpuram Anna Library',13.009,80.235,10),
  ('Perungudi Campus',12.9606,80.245,11)
) as v(n,la,lo,o) where buses.name='Route 06 - Padi';
