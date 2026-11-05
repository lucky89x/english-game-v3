shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;
// chibi05 stylised water (REF_04): bright azure, lighter shallows, animated white foam
// bands along the banks and soft caustic streaks. UV.x runs across the river ribbon.
uniform vec3 shallow_color : source_color = vec3(0.42,0.85,0.95);
uniform vec3 deep_color : source_color = vec3(0.13,0.55,0.88);
uniform vec3 foam_color : source_color = vec3(0.96,0.99,1.0);
uniform float flow_speed = 0.35;
uniform bool radial_edges = false;   // pond meshes: foam at the rim instead of UV.x edges
uniform float pond_radius = 5.0;
varying vec3 water_position;
varying vec3 local_position;
void vertex(){
 water_position=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
 local_position=VERTEX;
 VERTEX.y+=sin(water_position.x*1.4+water_position.z*0.8+TIME*0.9)*0.015;
}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+vec2(1)),f.x),f.y);}
float cells(vec2 p){
 // cheap voronoi edge distance for cartoon caustics
 vec2 i=floor(p), f=fract(p); float d1=8.0, d2=8.0;
 for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
  vec2 g=vec2(float(x),float(y));
  vec2 o=vec2(hash2(i+g),hash2(i+g+17.0));
  o=0.5+0.5*sin(TIME*0.8+6.2831*o);
  float d=length(g+o-f);
  if(d<d1){d2=d1;d1=d;} else if(d<d2){d2=d;}
 }
 return d2-d1;
}
void fragment(){
 vec2 p=water_position.xz;
 vec2 flow=vec2(0.0,-TIME*flow_speed);
 float edge=radial_edges ? smoothstep(0.70,1.0,length(local_position.xz)/pond_radius) : smoothstep(0.55,1.0,abs(UV.x*2.0-1.0));
 float centre=1.0-edge;
 vec3 water=mix(shallow_color,deep_color,centre*0.85);
 float fresnel=pow(1.0-max(dot(NORMAL,VIEW),0.0),3.0);
 water=mix(water,shallow_color*1.08,fresnel*0.5);
 float caustic=1.0-smoothstep(0.0,0.09,cells(p*0.85+flow*0.6));
 water=mix(water,shallow_color*1.18,caustic*0.35*centre);
 float n=noise2(p*1.3+flow*2.0);
 float band=sin((edge*9.0-TIME*1.6)+n*4.0);
 float foam=smoothstep(0.86,1.0,edge+n*0.12)+edge*smoothstep(0.55,0.95,band)*0.55;
 float streak=smoothstep(0.80,0.97,noise2(vec2(p.x*3.0,p.y*0.6)+flow*3.0))*0.35*centre;
 ALBEDO=mix(water,foam_color,clamp(foam+streak,0.0,1.0));
 float r=noise2(p*vec2(2.0,5.0)+flow*4.0);
 NORMAL=normalize(NORMAL+vec3((r-0.5)*0.08,0.0,(n-0.5)*0.08));
 ROUGHNESS=0.18; SPECULAR=0.55;
}
